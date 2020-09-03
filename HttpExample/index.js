
const appInsights = require('applicationinsights');
const { chromium, webkit } = require('playwright');
const assert = require('assert');

const appIngisht = appInsights.setup().start();
/**
 * In this script, we will go to a closed article on raamatupidaja.ee,
 * after that we verify that it is closed if we did not login,
 * after that we login and check if now article is avaialable.
 * 
 * Steps summary
 * 1. Go to testData.url
 * 2. Verify that article is closed
 * 3. Login as a user
 * 4. Verify that now article is available
 */


const testData = {   url: 'https://www.raamatupidaja.ee/uudised/2020/08/19/olukord-tooturul-on-endiselt-ebakindel', 
                    buySubscriptionOfferText: 'VORMISTA TELLIMUS KOHE JA SAAD:',
                    fullText: 'Mitmed suurema sagedusega koostatavad andmeallikad näitavad, et olukord tööturul on viimastel kuudel stabiliseerunud, kuigi võrrel',
                    login: '',
                    password: '' };


module.exports = async function (context, req) {

// Create a Chromium browser context
const browser = await chromium.launch({
    headless: true,
});
const context2 = await browser.newContext();
const page = await context2.newPage();

try{
// Go to closed article
await page.goto(testData.url);

// Check that article is closed
await verifyIsTextShown(page, testData.buySubscriptionOfferText);

await page.click(".Text-hciyki-0");
// Fill login form elements
await page.fill('#e-mail', testData.login);
await page.fill('#password', testData.password);
await page.click("[type='submit']");

// Go to article again
await page.goto(testData.url);

//Verify that there is closed text
await verifyIsTextShown(page, testData.fullText);

const successMessage = `Test have been completed!`;
context.bindings.availabilityTelemetry = {
    success: true,
    message: successMessage
};

} catch(error){
    const errorMessage = `Failed to execute`;
    context.bindings.availabilityTelemetry = {
        success: false,
        message: errorMessage + ". Error message: " + error
    };
};

//Close the browser
await browser.close();
}

const verifyIsTextShown = async (page,text) => {
assert(await page.$(`text=${text}`));
}

// Default export wrapped with Application Insights FaaS context propagation
export default async function contextPropagatingHttpTrigger(context, req) {
    // Start an AI Correlation Context using the provided Function context
    const correlationContext = appInsights.startOperation(context, req);

    // Wrap the Function runtime with correlationContext
    return appInsights.wrapWithCorrelationContext(async () => {
        const startTime = Date.now(); // Start trackRequest timer

        // Run the Function
        await httpTrigger(context, req);

        // Track Request on completion
        appInsights.defaultClient.trackRequest({
            name: context.req.method + " " + context.req.url,
            resultCode: context.res.status,
            success: true,
            url: req.url,
            duration: Date.now() - startTime,
            id: correlationContext.operation.parentId,
        });
        appInsights.defaultClient.flush();
    }, correlationContext)();
};





