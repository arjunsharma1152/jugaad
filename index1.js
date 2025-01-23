const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AnonymizeUAPlugin = require("puppeteer-extra-plugin-anonymize-ua");
const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "db1.coaching.net",
    user: "ads",
    password: "mPrSs=K)7W<-h#LAg:j~/q",
    database: "coaching_ads",
});

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());

(async () => {
    let browser, allLinks = [], data = [];

    try {
        connection.connect((err) => {
            if (err) {
                console.error("Connection failed:", err.message);
                process.exit(1);
            }
            console.log("Connection successful!");
        });

        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized", "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
            executablePath: "/root/chrome/linux-115.0.5790.98/chrome-linux64/chrome"
        });

        const page = await browser.newPage();

        console.log("Scraping Links!!!!!");

        for (let i = 1; i < 2; i++) {
            await page.goto(`https://www.kleinanzeigen.de/s-seite:${i}/coaching/k0`, {
                waitUntil: "domcontentloaded",
            });

            await page.waitForSelector("ul#srchrslt-adtable > li > article > div.aditem-main > div.aditem-main--middle > h2 > a");

            const links = await page.evaluate(() =>
                Array.from(
                    document.querySelectorAll(
                        "ul#srchrslt-adtable > li > article > div.aditem-main > div.aditem-main--middle > h2 > a"
                    )
                ).map((x) => x.href)
            );

            allLinks.push(...links);
        }

        for (let j = 0; j < allLinks.length; j++) {
            console.log(`Navigating to Link ${j}`);

            const link = allLinks[j];

            await page.goto(link, {
                waitUntil: "domcontentloaded",
            });

            await page.waitForSelector("#viewad-title");

            const title = await page.evaluate(() => {
                const titleDiv = document.querySelector("#viewad-title");
                return titleDiv ? titleDiv.innerText : " ";
            });

            const itemID = await page.evaluate(() => {
                const idDiv = document.querySelector("#viewad-ad-id-box > ul > li:nth-child(2)");
                return idDiv ? idDiv.innerText : " ";
            });

            const price = await page.evaluate(() => {
                const priceDiv = document.querySelector("#viewad-price");
                return priceDiv ? priceDiv.innerText : " ";
            });

            const address = await page.evaluate(() => {
                const addressDiv = document.querySelector("#viewad-locality");
                return addressDiv ? addressDiv.innerText : " ";
            });

            const date = await page.evaluate(() => {
                const dateDiv = document.querySelector("#viewad-extra-info > div > span");
                return dateDiv ? dateDiv.innerText : " ";
            });

            const viewsCount = await page.evaluate(() => {
                const viewsCountDiv = document.querySelector("#viewad-cntr-num");
                return viewsCountDiv ? viewsCountDiv.innerText : " ";
            });

            const imageURLs = await page.evaluate(() =>
                Array.from(
                    document.querySelectorAll(
                        "#viewad-product > div.galleryimage-large.l-container-row.j-gallery-image > div.galleryimage-element > img"
                    )
                ).map((x) => x.src)
            );

            const categoryURLs = await page.evaluate(() =>
                Array.from(document.querySelectorAll("#vap-brdcrmb > a")).map((x) => x.href)
            );

            const descriptionText = await page.evaluate(() => {
                const descriptionTextDiv = document.querySelector("#viewad-description-text");
                return descriptionTextDiv ? descriptionTextDiv.innerText : " ";
            });

            const sellerName = await page.evaluate(() => {
                const sellerNameDiv = document.querySelector("span.userprofile-vip > a");
                return sellerNameDiv ? sellerNameDiv.innerText : " ";
            });

            const sellerURL = await page.evaluate(() => {
                const sellerURLDiv = document.querySelector("span.userprofile-vip > a");
                return sellerURLDiv ? sellerURLDiv.href : " ";
            });

            // Define the data to insert
            const insertQuery = `
              INSERT INTO kleinanzeigen (url, title, itemID, price, address, date, viewsCount, primaryImage, imageURLs, categoryURLs, descriptionText, sellerName, sellerURL)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                link,
                title,
                itemID,
                price,
                address,
                date,
                viewsCount,
                imageURLs[0],
                `${imageURLs}`,
                `${categoryURLs}`,
                descriptionText,
                sellerName,
                sellerURL,
            ];

            // Execute the query
            connection.query(insertQuery, values, (err, results) => {
                if (err) {
                    console.error("Insertion failed:", err.message);
                } else {
                    console.log(`Data inserted successfully for link ${j}`, results);
                }
            });
        }
    } catch (e) {
        console.log(e);
    } finally {
        if (browser) await browser.close();

        connection.end((endErr) => {
            if (endErr) {
                console.error("Error ending the connection:", endErr.message);
            } else {
                console.log("Connection closed.");
            }
        });
    }
})();
