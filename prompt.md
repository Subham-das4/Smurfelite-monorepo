The entire codebase has become a mess after so many addition of feature that I lost task of what is developed and what is not.
Required Features:

1. Product:
   - listing products with pagination
   - View Product details
   - mark product as sold
   - Add product
   - mark a product as removed or deleted
   - Maintain vector of products for similar products
   - list similar products
   - Product Status Enum: Draft, Active, Pending Verification, Sold, Delisted_By_Seller, Banned_By_Admin.

2. Cart:
   - Add to cart
   - Delete from cart
   - list all items from cart

3. Order:
   - Create order
   - list order
   - after success purchase modify the order to mark as purchased or successfful
   - Remove items from cart after successfull order
   - Credentials delivered in email
   - Add dispute from orders page it will contain all details of the order and item
   - Remove transaction lock after either payment fails or time expires for the order

4. Enquiry
   - Add enquiry
   - list enquiry

5. Users
   - View users list with pagination and search
   - View single details with cart and orders , last login
   - View seller listed products

6. Authentication
   - Login as buyer to next website
   - Login as Seller
   - Login as admin

7. Admin
   - Delist a seller that will delist all his products (Add key in product to know if seller is delisted)
   - When we reactivate a seller, his products should start showing again
   - Add game category (like GTA V, CS2)
   - Mark a game catagory as restricted

8. Email
   - Send email from various emails like (finance@smurfelite.store, help@smurfelite.store and purchase@smurfelite.store)
   - Every email id, its credentials and name will be configured from .env
   - smtp will be same for all emails

9. Payment
   - Payment_Pending, Paid, Failed, and Refunded.
10. Dispute
    - Dispute management system in admin panel

11. Wallet & Seller Payouts
    - We will keep track of how much the seller has earned but payment to seller will be done manually by admin for now.
    - It will have pending balance and available to withdraw balance
    - Feature to freeze some balance of seller that is connected to a dispute.

12. Livechat
    - Free livechat integration in web

13. Cron job
    - Separate server for cronjobs to move balance from pending to withdraw

Note: For now skip the payment gateway. Make the code bypass it so that we will testing the entire website end to end before proceeding to integrating fully functional payment gateway.

Go through the entire codebase and find what all features are implemented in backend, frontend, admin panel and seller portal.
Note: admin panel and seller portal are not created yet.

Create an detailed todo list in -------plans folder-------- for feature references as we will be doing tasks in small chunks. It will be great if you divide tasks in chunks that development will be smooth and independent modules will be created first before the modules that depend on them.

Create different md file for all the apps , in -----plan folder------ to see the summary of those apps. it will be easy to refer codebase faster using those files.

Create an issues list in plans folder to keep track of current issues in website.

Dont do any code changes for now. now we will onky create all the plans in plans folder first.

Ask clarification questions
