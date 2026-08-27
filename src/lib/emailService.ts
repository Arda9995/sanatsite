import { supabase } from './supabase';

export interface AddressInfo {
    recipient_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
}

export interface OrderItemEmailInfo {
    title: string;
    artistName?: string;
    serialNumber?: string;
    quantity: number;
    price: number;
    size?: string;
    material?: string;
    frame?: string;
    imageUrl?: string;
}

export interface OrderConfirmationData {
    orderId: string;
    orderNumber?: string;
    customerEmail: string;
    totalAmount: number;
    currency: string;
    shippingAddress?: AddressInfo;
    billingAddress?: AddressInfo;
    customerNotes?: string;
    items: OrderItemEmailInfo[];
    lang?: 'tr' | 'en';
}

interface EmailNotification {
    type: 'delivery_set' | 'request_approved' | 'request_rejected' | 'order_confirmation';
    orderId: string;
    customerEmail: string;
    deliveryDate?: string;
    adminResponse?: string;
    orderNumber?: string;
    lang?: 'tr' | 'en';
}

/**
 * Queue an email notification for delivery date updates
 */
export async function queueDeliveryEmail(notification: EmailNotification) {
    const { type, orderId, customerEmail, deliveryDate, adminResponse, orderNumber, lang = 'tr' } = notification;

    let subject = '';
    let htmlBody = '';
    let textBody = '';

    const isTr = lang === 'tr';

    switch (type) {
        case 'delivery_set':
            subject = isTr ? 'Siparişinizin Teslimat Tarihi Planlandı' : 'Your Order Delivery Date Has Been Scheduled';
            textBody = isTr 
                ? `Merhaba,\n\n${orderNumber || orderId.slice(0, 8)} numaralı siparişinizin teslimat tarihi ${new Date(deliveryDate!).toLocaleDateString('tr-TR')} olarak planlanmıştır.\n\nTeşekkür ederiz!`
                : `Hello,\n\nYour order ${orderNumber || orderId.slice(0, 8)} has been scheduled for delivery on ${new Date(deliveryDate!).toLocaleDateString('en-US')}.\n\nThank you!`;
            htmlBody = generateDeliverySetEmail(orderId, orderNumber, deliveryDate!, isTr);
            break;

        case 'request_approved':
            subject = isTr ? 'Teslimat Tarihi Değişiklik Talebiniz Onaylandı' : 'Your Delivery Date Change Request Was Approved';
            textBody = isTr
                ? `Merhaba,\n\n${orderNumber || orderId.slice(0, 8)} numaralı siparişiniz için teslimat tarihi değişikliği talebiniz onaylandı. Yeni teslimat tarihi: ${new Date(deliveryDate!).toLocaleDateString('tr-TR')}.\n\n${adminResponse ? `Yönetici Notu: ${adminResponse}\n\n` : ''}Teşekkür ederiz!`
                : `Hello,\n\nYour delivery date change request for order ${orderNumber || orderId.slice(0, 8)} has been approved. New delivery date: ${new Date(deliveryDate!).toLocaleDateString('en-US')}.\n\n${adminResponse ? `Admin response: ${adminResponse}\n\n` : ''}Thank you!`;
            htmlBody = generateRequestApprovedEmail(orderId, orderNumber, deliveryDate!, adminResponse, isTr);
            break;

        case 'request_rejected':
            subject = isTr ? 'Teslimat Tarihi Değişiklik Talebiniz Hakkında' : 'Update on Your Delivery Date Change Request';
            textBody = isTr
                ? `Merhaba,\n\n${orderNumber || orderId.slice(0, 8)} numaralı siparişiniz için teslimat tarihi değişikliği talebiniz şu anda karşılanamamaktadır.\n\n${adminResponse ? `Neden: ${adminResponse}\n\n` : ''}Anlayışınız için teşekkür ederiz.`
                : `Hello,\n\nYour delivery date change request for order ${orderNumber || orderId.slice(0, 8)} could not be accommodated.\n\n${adminResponse ? `Reason: ${adminResponse}\n\n` : ''}Thank you for your understanding.`;
            htmlBody = generateRequestRejectedEmail(orderId, orderNumber, adminResponse, isTr);
            break;
    }

    const { error } = await supabase.from('email_queue').insert({
        to_email: customerEmail,
        subject,
        html_body: htmlBody,
        text_body: textBody,
        email_type: type,
        order_id: orderId,
        status: 'pending',
    });

    if (error) {
        console.error('Error queuing email:', error);
        throw error;
    }

    return { success: true };
}

/**
 * Queue a complete Order Confirmation Email containing billing, shipping, order notes & variations
 */
export async function queueOrderConfirmationEmail(data: OrderConfirmationData) {
    const isTr = (data.lang || 'tr') === 'tr';
    const orderNum = data.orderNumber ? `#${data.orderNumber}` : `#${data.orderId.slice(0, 8)}`;
    
    const subject = isTr 
        ? `Siparişiniz Onaylandı - ${orderNum}`
        : `Order Confirmation - ${orderNum}`;

    const htmlBody = generateOrderConfirmationHtml(data, isTr);
    const textBody = isTr
        ? `Siparişiniz için teşekkür ederiz! Sipariş No: ${orderNum}. Toplam Tutar: ${data.totalAmount} ${data.currency}. Detaylar web sitemizdeki Müşteri Panelinde mevcuttur.`
        : `Thank you for your purchase! Order #: ${orderNum}. Total: ${data.totalAmount} ${data.currency}. Details available in your Customer Dashboard.`;

    const { error } = await supabase.from('email_queue').insert({
        to_email: data.customerEmail,
        subject,
        html_body: htmlBody,
        text_body: textBody,
        email_type: 'order_confirmation',
        order_id: data.orderId,
        status: 'pending',
    });

    if (error) {
        console.error('Error queuing order confirmation email:', error);
        throw error;
    }

    return { success: true };
}

function formatAddr(addr?: AddressInfo): string {
    if (!addr) return '<em>-</em>';
    const parts = [
        addr.recipient_name ? `<strong>${addr.recipient_name}</strong>` : '',
        addr.address || '',
        [addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(', '),
        addr.phone ? `Tel: ${addr.phone}` : ''
    ].filter(Boolean);
    return parts.join('<br>');
}

function generateOrderConfirmationHtml(data: OrderConfirmationData, isTr: boolean): string {
    const orderNum = data.orderNumber ? `#${data.orderNumber}` : `#${data.orderId.slice(0, 8)}`;
    const shippingHtml = formatAddr(data.shippingAddress);
    const billingHtml = data.billingAddress ? formatAddr(data.billingAddress) : (isTr ? '<em>Teslimat Adresi ile Aynı</em>' : '<em>Same as Shipping Address</em>');

    const itemsRows = data.items.map(item => {
        const serialStr = item.serialNumber ? `<span style="font-family: monospace; font-weight: bold; color: #ea580c; background: #fff7ed; padding: 2px 6px; border-radius: 4px; border: 1px solid #ffedd5;">${item.serialNumber}</span>` : '-';
        const vars = [
            item.size ? `${isTr ? 'Boyut' : 'Size'}: <strong>${item.size}</strong>` : '',
            item.material ? `${isTr ? 'Materyal' : 'Material'}: <strong>${item.material}</strong>` : '',
            item.frame ? `${isTr ? 'Çerçeve' : 'Frame'}: <strong>${item.frame}</strong>` : ''
        ].filter(Boolean).join(' | ') || (isTr ? 'Standart' : 'Standard');

        const imageHtml = item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; display: block;" />` : '';

        return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px; vertical-align: top;">
                    <table style="border-collapse: collapse; border: 0;">
                        <tr>
                            ${imageHtml ? `<td style="padding-right: 12px; vertical-align: top;">${imageHtml}</td>` : ''}
                            <td style="vertical-align: top;">
                                <div style="font-weight: bold; color: #111827;">${item.title}</div>
                                ${item.artistName ? `<div style="font-size: 12px; color: #6b7280;">${item.artistName}</div>` : ''}
                            </td>
                        </tr>
                    </table>
                </td>
                <td style="padding: 12px; vertical-align: top; font-size: 13px;">${serialStr}</td>
                <td style="padding: 12px; vertical-align: top; font-size: 13px; color: #374151;">${vars}</td>
                <td style="padding: 12px; vertical-align: top; text-align: center; font-weight: bold;">${item.quantity}</td>
                <td style="padding: 12px; vertical-align: top; text-align: right; font-weight: bold; color: #ea580c;">${item.price * item.quantity} ${data.currency}</td>
            </tr>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6; }
          .container { max-width: 650px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #ec4899 0%, #f97316 50%, #eab308 100%); color: white; padding: 32px; text-align: center; }
          .content { padding: 30px; }
          .grid { display: table; width: 100%; margin-bottom: 24px; }
          .col { display: table-cell; width: 50%; vertical-align: top; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6; }
          .note-box { background: #fefce8; border: 1px solid #fef08a; border-left: 4px solid #eab308; padding: 15px; border-radius: 8px; margin-bottom: 24px; font-style: italic; }
          .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; border-top: 1px solid #f3f4f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎨 ${isTr ? 'Siparişiniz Onaylandı!' : 'Order Confirmed!'}</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">${isTr ? `Sipariş Numarası: ${orderNum}` : `Order #: ${orderNum}`}</p>
          </div>
          <div class="content">
            <p>${isTr ? 'Merhaba,' : 'Hello,'}</p>
            <p>${isTr ? `Siparişiniz başarıyla alındı. Aşağıda teslimat adresi, fatura adresi, müşteri notu ve sipariş ettiğiniz eser varyasyonlarının detaylarını görebilirsiniz:` : `Thank you for your purchase! Below are the full details of your shipping address, billing address, order notes, and chosen artwork variations:`}</p>

            <table style="width: 100%; margin: 20px 0;">
                <tr>
                    <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                        <h4 style="margin: 0 0 10px 0; color: #ea580c; font-size: 14px; text-transform: uppercase;">📍 ${isTr ? 'Teslimat Adresi' : 'Shipping Address'}</h4>
                        <div style="font-size: 13px; color: #374151;">${shippingHtml}</div>
                    </td>
                    <td style="width: 4%;"></td>
                    <td style="width: 48%; vertical-align: top; background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                        <h4 style="margin: 0 0 10px 0; color: #ea580c; font-size: 14px; text-transform: uppercase;">📄 ${isTr ? 'Fatura Adresi' : 'Billing Address'}</h4>
                        <div style="font-size: 13px; color: #374151;">${billingHtml}</div>
                    </td>
                </tr>
            </table>

            ${data.customerNotes ? `
                <div class="note-box">
                    <strong style="color: #854d0e; font-style: normal; display: block; margin-bottom: 4px;">💬 ${isTr ? 'Müşteri Notu / Özel İstek:' : 'Customer Note / Request:'}</strong>
                    "${data.customerNotes}"
                </div>
            ` : ''}

            <h3 style="color: #111827; font-size: 16px; margin: 24px 0 12px 0; border-bottom: 2px solid #ea580c; padding-bottom: 6px;">
                🖼️ ${isTr ? 'Sipariş Edilen Eserler & Varyasyonlar' : 'Ordered Artworks & Variations'}
            </h3>

            <table class="table">
                <thead>
                    <tr style="background: #f9fafb; color: #4b5563; font-size: 12px; text-transform: uppercase;">
                        <th style="padding: 10px; text-align: left;">${isTr ? 'Eser' : 'Artwork'}</th>
                        <th style="padding: 10px; text-align: left;">${isTr ? 'Eser No' : 'Serial'}</th>
                        <th style="padding: 10px; text-align: left;">${isTr ? 'Varyasyonlar' : 'Variations'}</th>
                        <th style="padding: 10px; text-align: center;">${isTr ? 'Adet' : 'Qty'}</th>
                        <th style="padding: 10px; text-align: right;">${isTr ? 'Toplam' : 'Total'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>

            <div style="margin-top: 24px; text-align: right; padding-top: 16px; border-top: 2px solid #e5e7eb;">
                <span style="font-size: 16px; font-weight: bold; color: #111827;">${isTr ? 'Toplam Ödenen Tutar:' : 'Total Paid:'}</span>
                <span style="font-size: 22px; font-weight: 800; color: #ea580c; margin-left: 10px;">${data.totalAmount} ${data.currency}</span>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0 0 4px 0;">${isTr ? 'Bizi tercih ettiğiniz için teşekkür ederiz!' : 'Thank you for choosing us!'}</p>
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">${isTr ? 'Bu mesaj otomatik olarak sipariş onayınız üzerine oluşturulmuştur.' : 'This is an automated purchase confirmation.'}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateDeliverySetEmail(orderId: string, orderNumber: string | undefined, deliveryDate: string, isTr: boolean): string {
    const formattedDate = new Date(deliveryDate).toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #ec4899 0%, #f97316 50%, #eab308 100%); color: white; padding: 30px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .date-box { background: white; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 ${isTr ? 'Teslimat Tarihi Planlandı' : 'Delivery Date Scheduled'}</h1>
          </div>
          <div class="content">
            <p>${isTr ? 'Merhaba,' : 'Hello,'}</p>
            <p>${isTr ? `Harika haber! <strong>${orderNumber || '#' + orderId.slice(0, 8)}</strong> numaralı siparişinizin teslimat tarihi belirlendi.` : `Great news! Your order <strong>${orderNumber || '#' + orderId.slice(0, 8)}</strong> has been scheduled for delivery.`}</p>
            
            <div class="date-box">
              <strong>📅 ${isTr ? 'Teslimat Tarihi:' : 'Delivery Date:'}</strong><br>
              <span style="font-size: 18px; color: #f97316;">${formattedDate}</span>
            </div>
            
            <p>${isTr ? 'Lütfen belirtilen tarihte teslimatı teslim alacak birinin bulunduğundan emin olun.' : 'Please ensure someone is available to receive the delivery on this date.'}</p>
            <p>${isTr ? 'Tarih değişikliği talep etmek isterseniz müşteri panelinizden işlem yapabilirsiniz.' : 'If you need to request a change, you can do so from your customer dashboard.'}</p>
            
            <div class="footer">
              <p>${isTr ? 'Siparişiniz için teşekkür ederiz!' : 'Thank you for your order!'}</p>
              <p style="font-size: 12px; color: #999;">${isTr ? 'Bu otomatik bir bilgilendirme mesajıdır.' : 'This is an automated message.'}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateRequestApprovedEmail(orderId: string, orderNumber: string | undefined, deliveryDate: string, adminResponse?: string, isTr: boolean = false): string {
    const formattedDate = new Date(deliveryDate).toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .date-box { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
          .response-box { background: #ecfdf5; border: 1px solid #10b981; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ ${isTr ? 'Talep Onaylandı' : 'Request Approved'}</h1>
          </div>
          <div class="content">
            <p>${isTr ? 'Merhaba,' : 'Hello,'}</p>
            <p>${isTr ? `Güzel haber! <strong>${orderNumber || '#' + orderId.slice(0, 8)}</strong> numaralı siparişinizin teslimat tarihi değişikliği talebi onaylandı.` : `Good news! Your delivery date change request for order <strong>${orderNumber || '#' + orderId.slice(0, 8)}</strong> has been approved.`}</p>
            
            <div class="date-box">
              <strong>📅 ${isTr ? 'Yeni Teslimat Tarihi:' : 'New Delivery Date:'}</strong><br>
              <span style="font-size: 18px; color: #10b981;">${formattedDate}</span>
            </div>
            
            ${adminResponse ? `
              <div class="response-box">
                <strong>${isTr ? 'Yönetici Notu:' : 'Admin Response:'}</strong><br>
                ${adminResponse}
              </div>
            ` : ''}
            
            <p>${isTr ? 'Siparişiniz yeni belirlenen tarihte teslim edilecektir. Sabrınız için teşekkür ederiz!' : 'Your order will now be delivered on the new date. Thank you for your patience!'}</p>
            
            <div class="footer">
              <p>${isTr ? 'Bizi tercih ettiğiniz için teşekkür ederiz!' : 'Thank you for choosing us!'}</p>
              <p style="font-size: 12px; color: #999;">${isTr ? 'Bu otomatik bir bilgilendirme mesajıdır.' : 'This is an automated message.'}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateRequestRejectedEmail(orderId: string, orderNumber: string | undefined, adminResponse?: string, isTr: boolean = false): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .response-box { background: #fef2f2; border: 1px solid #ef4444; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 ${isTr ? 'Talep Güncellemesi' : 'Request Update'}</h1>
          </div>
          <div class="content">
            <p>${isTr ? 'Merhaba,' : 'Hello,'}</p>
            <p>${isTr ? `<strong>${orderNumber || '#' + orderId.slice(0, 8)}</strong> numaralı siparişinizin teslimat tarihi değişikliği talebi incelenmiştir.` : `We've reviewed your delivery date change request for order <strong>${orderNumber || '#' + orderId.slice(0, 8)}</strong>.`}</p>
            
            <p>${isTr ? 'Ne yazık ki talep ettiğiniz değişiklik şu anda gerçekleştirilememektedir.' : "Unfortunately, we're unable to accommodate your requested change at this time."}</p>
            
            ${adminResponse ? `
              <div class="response-box">
                <strong>${isTr ? 'Neden:' : 'Reason:'}</strong><br>
                ${adminResponse}
              </div>
            ` : ''}
            
            <p>${isTr ? 'Orijinal teslimat tarihiniz geçerliliğini korumaktadır. Sorularınız varsa lütfen bizimle iletişime geçin.' : 'Your original delivery date remains unchanged. If you have questions, please contact us.'}</p>
            
            <div class="footer">
              <p>${isTr ? 'Anlayışınız için teşekkür ederiz!' : 'We appreciate your understanding!'}</p>
              <p style="font-size: 12px; color: #999;">${isTr ? 'Bu otomatik bir bilgilendirme mesajıdır.' : 'This is an automated message.'}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
