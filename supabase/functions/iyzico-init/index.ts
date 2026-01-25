import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Iyzipay from "npm:iyzipay@2.0.61"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user, cartItems, totalAmount, shippingAddress } = await req.json()

    // Initialize Iyzipay
    const apiKey = Deno.env.get('IYZICO_API_KEY');
    const secretKey = Deno.env.get('IYZICO_SECRET_KEY');
    const baseUrl = 'https://sandbox-api.iyzipay.com'; // Enforce Sandbox URL for dev to avoid 404s from bad secrets

    console.log("Iyzipay Init Config:", {
      hasApiKey: !!apiKey,
      hasSecretKey: !!secretKey,
      baseUrl
    });

    const iyzipay = new Iyzipay({
      apiKey: apiKey || '',
      secretKey: secretKey || '',
      uri: baseUrl
    });

    // Create a unique basket ID
    const basketId = `B${Date.now()}`;
    const conversationId = `C${Date.now()}`;

    // Prepare basket items and Recalculate Total
    let calculatedTotal = 0;
    const basketItems = cartItems.map((item: any) => {
      const itemPrice = parseFloat((item.price || item.artwork.price).toString());
      calculatedTotal += itemPrice;
      return {
        id: item.artwork_id,
        name: item.artwork.title,
        category1: 'Art',
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: itemPrice.toFixed(2)
      };
    });

    const finalPrice = calculatedTotal.toFixed(2);

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: conversationId,
      price: finalPrice,
      paidPrice: finalPrice,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: basketId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      // IMPORTANT: Point to the 'iyzico-check' function, NOT the frontend
      // This ensures the callback (POST) is handled by the backend, which then redirects to the frontend.
      callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/iyzico-check`,
      enabledInstallments: [2, 3, 6, 9],
      buyer: {
        id: user.id || 'guest',
        name: shippingAddress.fullName.split(' ')[0],
        surname: shippingAddress.fullName.split(' ').slice(1).join(' ') || 'User',
        gsmNumber: shippingAddress.phone,
        email: shippingAddress.email,
        identityNumber: '11111111111',
        lastLoginDate: '2024-01-01 12:00:00',
        registrationAddress: shippingAddress.address,
        ip: '85.34.78.112',
        city: shippingAddress.city,
        country: shippingAddress.country,
        zipCode: shippingAddress.zipCode
      },
      shippingAddress: {
        contactName: shippingAddress.fullName,
        city: shippingAddress.city,
        country: shippingAddress.country,
        address: shippingAddress.address,
        zipCode: shippingAddress.zipCode
      },
      billingAddress: {
        contactName: shippingAddress.fullName,
        city: shippingAddress.city,
        country: shippingAddress.country,
        address: shippingAddress.address,
        zipCode: shippingAddress.zipCode
      },
      basketItems: basketItems
    };

    console.log("Sending request to Iyzico:", JSON.stringify(request));

    return new Promise((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
        if (err) {
          console.error("Iyzico Error:", err);
          resolve(
            new Response(JSON.stringify({ error: err.message }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            })
          )
        } else {
          console.log("Iyzico Result:", result);
          resolve(
            new Response(JSON.stringify(result), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            })
          )
        }
      });
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
