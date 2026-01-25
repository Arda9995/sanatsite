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
        const baseUrl = 'https://sandbox-api.iyzipay.com'; // Enforce Sandbox URL

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

        // Log the full result for debugging
        console.log("Iyzico Verification Result:", JSON.stringify(verificationResult, null, 2));

        const isSuccess = verificationResult.status === 'success' && verificationResult.paymentStatus === 'SUCCESS';
        const failureMessage = verificationResult.errorMessage || 'Payment validation failed';

        // 4. Handle Response based on Source
        if (isCallback) {
            // Redirect to Frontend
            // NOTE: You might need to adjust the redirect URL if your frontend is not localhost in production.
            // Ideally, pass the frontend URL as a param or env var, or fallback to a known URL.
            // For now, we assume standard localhost for dev or a configured SITE_URL.

            // Hardcoded for now based on user context, but ideally Deno.env.get('SITE_URL')
            const frontendUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';
            const redirectUrl = new URL(`${frontendUrl}/payment-result`);

            if (isSuccess) {
                redirectUrl.searchParams.set('status', 'success');
                redirectUrl.searchParams.set('token', token);
                redirectUrl.searchParams.set('paymentId', verificationResult.paymentId);
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
                paymentId: verificationResult.paymentId,
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
