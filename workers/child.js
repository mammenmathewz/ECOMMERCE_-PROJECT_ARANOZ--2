const Order = require("../models/checkout");
const easyinvoice = require('easyinvoice');
const moment = require("moment");
const fs = require('fs');
const path = require('path');



process.on('message', async (orderId) => {
    try {
        const order = await Order.findById(orderId)
            .populate("items.productId")
            .populate("user");

        if (!order) {
            console.log(`No order found with id: ${orderId}`);
            return;
        }

        let index = order.selectedAddress;

        const ordersInfo = order.items.map((item) => ({
            quantity: item.quantity,
            description: `${item.productId.productname}`,
            price: item.productId.saleprice,
            Total: order.total - order.discount - order.grandTotal,
        }));

        var data = {
            apiKey: "9IfEYtA5Bc3sS6gaj7W85B4JjtctPTihRY3uUmyW34Ezwvmh6SChsPxL7d18AYEB",
            mode: "development",
            images: {
                logo: "https://themewagon.github.io/aranoz/img/logo.png",

            },
            sender: {
                company: "Aranoz",
                address: "Sample Street 123",
                zip: "1234 AB",
                city: "Sampletown",
                country: "Samplecountry",
            },
            client: {
                company: order.user.first_name + ' ' + order.user.last_name,
                address: order.user.address[index].address1,
                zip: order.user.address[index].pin.toString(),
                city: order.user.address[index].district,
                country: order.user.address[index].state
            },
            information: {
                ID: order._id,
                date: moment(order.date).format('YYYY-MM-DD HH:mm:ss'),
            },
            products: ordersInfo,
            bottomNotice: "Your satisfaction is our priority. Thank you for choosing Aranoz.com",
            settings: {
                currency: "INR",
            },
        };


        const result = await easyinvoice.createInvoice(data);

        const folderPath = path.join(__dirname, '..', 'public', 'Invoice');
        const filePath = path.join(folderPath, `${order._id}.pdf`);

        fs.mkdirSync(folderPath, { recursive: true });
        fs.writeFileSync(filePath, result.pdf, 'base64');

        order.invoice = filePath;
        await order.save();

        process.send(`Invoice saved at: ${filePath}`);

    } catch (error) {
        console.error('Error:', error);
    }
});
