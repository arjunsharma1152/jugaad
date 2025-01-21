const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AnonymizeUAPlugin = require("puppeteer-extra-plugin-anonymize-ua");
const fs = require('fs');

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());


(async () => {

    let browser, allLinks = [], data = [];

    try {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized', "--no-sandbox", '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            executablePath: "/root/chrome/linux-115.0.5790.98/chrome-linux64/chrome"
        });


        const page = await browser.newPage();


        for (let i = 1; i < 2; i++) {

            await page.goto(`https://www.kleinanzeigen.de/s-seite:${i}/coaching/k0`, {
                waitUntil: "domcontentloaded",
            });

            await page.waitForSelector('ul#srchrslt-adtable > li > article > div.aditem-main > div.aditem-main--middle > h2 > a');

            const links = await page.evaluate(() => Array.from(document.querySelectorAll("ul#srchrslt-adtable > li > article > div.aditem-main > div.aditem-main--middle > h2 > a")).map(x => x.href));

            allLinks.push(...links);
        }

        for (let link of allLinks) {
            await page.goto(link, {
                waitUntil: "domcontentloaded",
            });
            // console.log(link);

            await page.waitForSelector('#viewad-title');

            const title = await page.evaluate(() => {
                const titleDiv = document.querySelector('#viewad-title');
                if (titleDiv) {
                    return titleDiv.innerText;
                } else {
                    return " ";
                }
            });

            const id = await page.evaluate(() => {
                const idDiv = document.querySelector('#viewad-ad-id-box > ul > li:nth-child(2)');
                if (idDiv) {
                    return idDiv.innerText;
                } else {
                    return " ";
                }
            });

            const price = await page.evaluate(() => {
                const priceDiv = document.querySelector('#viewad-price');
                if (priceDiv) {
                    return priceDiv.innerText;
                } else {
                    return " ";
                }
            });

            // const art = await page.evaluate(() => {
            //     const artDiv = document.querySelector('#viewad-details > ul > li > span');
            //     if (artDiv) {
            //         return artDiv.innerText;
            //     } else {
            //         return " ";
            //     }
            // });

            const address = await page.evaluate(() => {
                const addressDiv = document.querySelector('#viewad-locality');
                if (addressDiv) {
                    return addressDiv.innerText;
                } else {
                    return " ";
                }
            });

            const date = await page.evaluate(() => {
                const dateDiv = document.querySelector('#viewad-extra-info > div > span');
                if (dateDiv) {
                    return dateDiv.innerText;
                } else {
                    return " ";
                }
            });

            const viewsCount = await page.evaluate(() => {
                const viewsCountDiv = document.querySelector('#viewad-cntr-num');
                if (viewsCountDiv) {
                    return viewsCountDiv.innerText;
                } else {
                    return " ";
                }
            });

            const imageURLs = await page.evaluate(() => { return Array.from(document.querySelectorAll("#viewad-product > div.galleryimage-large.l-container-row.j-gallery-image > div.galleryimage-element > img")).map(x => x.src) });

            const categoryURLs = await page.evaluate(() => { return Array.from(document.querySelectorAll("#vap-brdcrmb > a")).map(x => x.href) });

            const descriptionText = await page.evaluate(() => {
                const descriptionTextDiv = document.querySelector('#viewad-description-text');
                if (descriptionTextDiv) {
                    return descriptionTextDiv.innerText;
                } else {
                    return " ";
                }
            });

            const sellerName = await page.evaluate(() => {
                const sellerNameDiv = document.querySelector('span.userprofile-vip > a');
                if (sellerNameDiv) {
                    return sellerNameDiv.innerText;
                } else {
                    return " ";
                }
            });


            const sellerURL = await page.evaluate(() => {
                const sellerURLDiv = document.querySelector('span.userprofile-vip > a');
                if (sellerURLDiv) {
                    return sellerURLDiv.href;
                } else {
                    return " ";
                }
            });

            const obj = {
                url: link,
                title,
                id,
                price,
                address,
                date,
                viewsCount,
                primaryImage: imageURLs[0],
                imageURLs,
                categoryURLs,
                descriptionText,
                sellerName,
                sellerURL
            }

            data.push(obj);
        }
    } catch (e) {
        console.log(e)
    } finally {

        const finalData = JSON.stringify(data);

        fs.writeFile('data.json', finalData, (err) => {
            if (err) throw err;
            console.log('DATA EXTRACTED');
        });

        await browser.close();
    }

})();