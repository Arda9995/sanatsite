# Edge Function Source Code

Since you prefer to deploy these manually or via a web-based interface, here is the exact TypeScript code for the two required functions.

You must create two separate functions in Supabase (or your deployment target).

---

## Function 1: `iyzico-init`
**Purpose:** Initializes the checkout form.

```typescript
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

    const apiKey = Deno.env.get('IYZICO_API_KEY');
    const secretKey = Deno.env.get('IYZICO_SECRET_KEY');
    const baseUrl = 'https://sandbox-api.iyzipay.com';

    console.log("Iyzipay Init Config:", { hasApiKey: !!apiKey, hasSecretKey: !!secretKey, baseUrl });

    const iyzipay = new Iyzipay({
      apiKey: apiKey || '',
      secretKey: secretKey || '',
      uri: baseUrl
    });

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
```

---

## Function 2: `iyzico-check`
**Purpose:** Verifies payment with Iyzico. Handles both Iyzico Callbacks (Form POST) and Frontend Verification (JSON POST).

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Iyzipay from "npm:iyzipay@2.0.61"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        let token: string | undefined;
        let isCallback = false;

        // 1. Determine Request Type (Callback vs Verification)
        const contentType = req.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            // Frontend checking status via JSON
            const body = await req.json();
            token = body.token;
        } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
            // Iyzico Callback via Form POST
            const formData = await req.formData();
            token = formData.get('token')?.toString();
            isCallback = true;
        }

        if (!token) {
            throw new Error('No token found in request');
        }

        console.log(`Processing ${isCallback ? 'Callback' : 'Verification'} for token: ${token}`);

        // 2. Setup Iyzico
        const apiKey = Deno.env.get('IYZICO_API_KEY');
        const secretKey = Deno.env.get('IYZICO_SECRET_KEY');
        const baseUrl = 'https://sandbox-api.iyzipay.com'; // Enforce Sandbox

        const iyzipay = new Iyzipay({
            apiKey: apiKey || '',
            secretKey: secretKey || '',
            uri: baseUrl
        });

        // 3. Retrieve payment result from Iyzico
        const verificationResult = await new Promise((resolve, reject) => {
            iyzipay.checkoutForm.retrieve({
                locale: Iyzipay.LOCALE.TR,
                conversationId: '123456789', 
                token: token
            }, (err: any, result: any) => {
                if (err) reject(err);
                else resolve(result);
            });
        }) as any;

        // Log the Full Result for Debugging
        console.log("Iyzico Verification Result (Raw):", JSON.stringify(verificationResult, null, 2));

        const isSuccess = verificationResult?.status === 'success' && verificationResult?.paymentStatus === 'SUCCESS';
        const failureMessage = verificationResult?.errorMessage || 'Payment validation failed';

        // 5. Create Order if Success
        if (isSuccess && !isCallback) {
            try {
                const supabaseAdmin = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                );

                // Get User from Auth Header
                const authHeader = req.headers.get('Authorization');
                if (authHeader) {
                    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));

                    if (user) {
                        // IDEMPOTENCY CHECK:
                        // Check if an order was created in the last 2 minutes for this user with this exact amount.
                        // We are keeping this simple and robust to avoid schema issues with JSON querying.
                        
                        const checkPrice = parseFloat(verificationResult.price); 
                        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

                        const { data: existingRecentOrder } = await supabaseAdmin
                            .from('orders')
                            .select('id')
                            .eq('user_id', user.id)
                            .eq('total_amount', checkPrice)
                            .gte('created_at', twoMinutesAgo)
                            .maybeSingle();

                        if (existingRecentOrder) {
                            console.log(`DUPLICATE PREVENTED: Order ${existingRecentOrder.id} already exists for user ${user.id} with amount ${checkPrice} within 2 minutes.`);
                        } else {
                            // Check CART ITEMS
                            const { data: cartItems } = await supabaseAdmin
                                .from('cart_items')
                                .select('*')
                                .eq('user_id', user.id);

                            if (cartItems && cartItems.length > 0) {
                                // Create Order Record
                                // Safely Construct Shipping Address with Fallbacks
                                // Sometimes Iyzico doesn't return the full object structure on check, or validation mode differs.
                                const orderShippingAddress = {
                                    contactName: verificationResult?.shippingAddress?.contactName || 'Unknown',
                                    city: verificationResult?.shippingAddress?.city || '',
                                    country: verificationResult?.shippingAddress?.country || '',
                                    address: verificationResult?.shippingAddress?.address || '',
                                    zipCode: verificationResult?.shippingAddress?.zipCode || '',
                                    payment_token: token,
                                    payment_id: verificationResult?.paymentId,
                                    conversation_id: verificationResult?.conversationId,
                                    buyer_email: verificationResult?.buyer?.email,
                                    buyer_gsmNumber: verificationResult?.buyer?.gsmNumber,
                                };
                                
                                const { data: order, error: orderError } = await supabaseAdmin
                                    .from('orders')
                                    .insert({
                                        user_id: user.id,
                                        total_amount: checkPrice,
                                        status: 'completed',
                                        shipping_address: orderShippingAddress,
                                    })
                                    .select()
                                    .single();

                                if (!orderError) {
                                    // Create Order Items
                                    const orderItemsPayload = cartItems.map((item: any) => ({
                                        order_id: order.id,
                                        artwork_id: item.artwork_id,
                                        price: item.price,
                                        quantity: item.quantity,
                                        size: item.size,
                                        material: item.material,
                                        frame: item.frame
                                    }));

                                    await supabaseAdmin.from('order_items').insert(orderItemsPayload);

                                    // Clear Cart
                                    await supabaseAdmin.from('cart_items').delete().eq('user_id', user.id);
                                    console.log(`SUCCESS: Order ${order.id} created.`);
                                } else {
                                    console.error("Order Insert Error:", orderError);
                                }
                            } else {
                                console.log("SKIPPING: Cart is empty (maybe already processed?)");
                            }
                        }
                    }
                }
            } catch (orderError) {
                console.error("Failed to create order records:", orderError);
            }
        }

        // 4. Handle Response based on Source
        if (isCallback) {
            // Redirect to Frontend
            const frontendUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'; 
            const redirectUrl = new URL(`${frontendUrl}/payment-result`);
            
            if (isSuccess) {
                redirectUrl.searchParams.set('status', 'success');
                redirectUrl.searchParams.set('token', token);
                redirectUrl.searchParams.set('paymentId', verificationResult?.paymentId);
            } else {
                redirectUrl.searchParams.set('status', 'failure');
                redirectUrl.searchParams.set('message', failureMessage);
            }

            return Response.redirect(redirectUrl.toString(), 303);

        } else {
            // Return JSON to Frontend
            if (!isSuccess) {
                throw new Error(failureMessage);
            }

            return new Response(JSON.stringify({
                status: 'success',
                paymentId: verificationResult?.paymentId,
                data: verificationResult
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

    } catch (error: any) {
        console.error("Verification Error:", error);
        
        // Return 200 even on error so the frontend 'invoke' client parses the JSON body 
        // and we can display the actual error message to the user/developer.
        return new Response(JSON.stringify({ 
            errorMessage: error.message || 'Unknown Error', 
            status: 'failure' 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, 
        });
    }
})
```
