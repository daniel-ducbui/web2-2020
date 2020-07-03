
const {Router} =require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler')
const router = new Router();
const db = require('../services/db')
const User = require('../services/user');
const Account = require('../services/account');
const SavingAccount = require('../services/saving_account');
const Transaction = require('../services/transaction');
const Bank = require('../services/bank');
const BeneficiatyAccount= require('../services/beneficiaryAccount');
const Email = require('../services/email');
// const { tableName } = require('../services/user');
const crypto = require('crypto');
// const { INTEGER } = require('sequelize/types');
const Sequelize = require('sequelize')

var account ;
var BeneficiaryDisplayname;
var BeneficiaryNumberAccount;
var BeneficiaryBalance;
var content ;
var token;
var SoTien;
var NganHang;
var fee;

var totalMoney;
var extraMoney;
var beneficiaryExtraMoney;
var listBank;
const bankRoot="Vietcombank"
router.get('/',async (req,res)=>{
    // const listBank=[
    //     {bank:'Vietcombank',id:'36'},
    //     {bank:'Agribank',id:'05'},
    //     {bank:'Đông Á',id:'06'},
    //     {bank:'BIDV',id:'18'},
    //     {bank:'MBBank',id:'22'},
    //     {bank:'TPBank',id:'23'},
    //     {bank:'VPBank',id:'32'},
    //     {bank:'Eximbank',id:'31'},
    //     {bank:'VIB',id:'41'},
    //     {bank:'Techcombank',id:'07'},
    // ];
    // for(var i=0;i<listBank.length;i++)
    // {
    //     console.log("  cccc" +listBank[i].bank)
    //     await Bank.create({
    //         nameBank: listBank[i].bank,
    //         idBank: listBank[i].id,
    //     })
    // }
    listBank =await Bank.AllBank();
    account =await Account.findAccountrByAccountNumber(res.locals.account.accountNumber);
    return res.render('./pages/transactions/transaction',{errors:null,listBank:listBank});  
});
router.post('/',[
    body('SoTien')
        .custom(async function(SoTienBody,{req}){
           
            if(req.body.STKHuongThu)
            {
                if(SoTienBody<50000){
                    throw Error('Số tiền tối thiểu 50000 VND');
                }
                NganHang = req.body.NganHang;
                if(NganHang != bankRoot) //khac ngan hang
                {     
                    fee = parseInt(SoTienBody * 0.0003);
                    if(fee<10000)
                    {
                        fee=10000;
                    }

                }
                else   // cung ngan hang
                {       
                    fee = 5000;
                }
                totalMoney = parseInt(SoTienBody) + fee;
                extraMoney = parseInt(account.balance) - parseInt(totalMoney);
                if(extraMoney<50000)
                {
                    throw Error('Số dư không đủ');
                }
                return true;
            }
        }),

    body('STKHuongThu')
        .custom(async function(STKHuongThu){
            if(STKHuongThu=="")
            {
                throw Error('Số tài khoản không tồn tại');
            }
            if(!STKHuongThu)
            {
                return false;
            }
            else
            {
                const account = await Account.findAccountrByAccountNumber(STKHuongThu)
                const beneficiatAccount = await BeneficiatyAccount.findAccountrByAccountNumber(STKHuongThu)
                if(!account && !beneficiatAccount)
                {
                    throw Error('Số tài khoản không tồn tại');
                }
    
            }
           
            return true;
        }),
 
        
] ,asyncHandler(async function(req,res){
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('./pages/transactions/transaction',{errors :errors.errors,listBank:listBank});
    }
   
   if(!req.body.STKHuongThu)
   {
       if(req.body.OTP.toUpperCase()==token)
       {       
            console.log("-------------------1" + NganHang) 
            await Account.updateBalance(extraMoney,res.locals.account.accountNumber);
            if(NganHang != bankRoot) // khac ngan hang
            {
                console.log(beneficiaryExtraMoney)
                await BeneficiatyAccount.updateBalance(beneficiaryExtraMoney,BeneficiaryNumberAccount);
            }
            else
            {
                console.log("-------------------2"+beneficiaryExtraMoney,BeneficiaryNumberAccount)  
                await Account.updateBalance(beneficiaryExtraMoney,BeneficiaryNumberAccount);
            }  
            console.log("-------------------2")        
            await Email.send(req.session.currentUser.email,'Vietcombank',account.accountNumber+" "+res.locals.currentUser.displayName+" tới "+
            BeneficiaryNumberAccount+" "+BeneficiaryDisplayname +" : "+SoTien +"\nSố dư : "+extraMoney )
            console.log("-------------------3")  
            const transaction = await Transaction.create({
                accountNumber:res.locals.account.accountNumber,
                amount: SoTien,
                content:content,
                beneficiaryBank:NganHang,
                beneficiaryAccount :  BeneficiaryNumberAccount
    
            })
            res.render('./pages/transactions/transaction2')
       }
       else
       {
          
             
             return res.render('./pages/transactions/transaction1',{
                errors:"Token không chính xác",
                BeneficiaryDisplayname:BeneficiaryDisplayname,
                BeneficiaryNumberAccount:BeneficiaryNumberAccount,
                account:account,
                SoTien:req.body.SoTien,
                content:content,
                fee:fee,
            }); 
       }
  
   }
   else
   {
        if(req.body.NganHang != bankRoot) //khac ngan hang
        {
            const BeneficiaryAccountFalse =await BeneficiatyAccount.findAccountrByAccountNumber(req.body.STKHuongThu);
            BeneficiaryNumberAccount = BeneficiaryAccountFalse.accountNumber;
            BeneficiaryDisplayname = BeneficiaryAccountFalse.displayName;
            BeneficiaryBalance = BeneficiaryAccountFalse.balance;
            
            fee = parseInt(req.body.SoTien * 0.0003);
            if(fee<10000)
            {
                fee=10000;
            }

        }
        else   // cung ngan hang
        {
            fee =5000;
            const BeneficiaryAccountTrue =await Account.findAccountrByAccountNumber(req.body.STKHuongThu);
            const BeneficiaryUserTrue = await User.findUserById(BeneficiaryAccountTrue.userId)
            BeneficiaryNumberAccount = BeneficiaryAccountTrue.accountNumber;
            BeneficiaryDisplayname = BeneficiaryUserTrue.displayName;
            BeneficiaryBalance = BeneficiaryAccountTrue.balance;
        }
        
        
        content = req.body.NoiDung==''?account.accountNumber+" "+res.locals.currentUser.displayName+" tới "+
        BeneficiaryNumberAccount+" "+BeneficiaryDisplayname+" " : req.body.NoiDung;
        
       
        SoTien= req.body.SoTien;
        NganHang = req.body.NganHang;
        // totalMoney = parseInt(req.body.SoTien) + fee;
        // extraMoney = parseInt(account.balance) - totalMoney;
        beneficiaryExtraMoney = parseInt(BeneficiaryBalance)+parseInt(req.body.SoTien)
        
        token = crypto.randomBytes(2).toString("hex").toUpperCase(); res.locals.token = token;
        if(extraMoney<50000)
        {
            throw Error('Số dư không đủ');
        }
        else
        {
            console.log(extraMoney)
            Email.send(res.locals.currentUser.email,"Vietcombank",token)
            return res.render('./pages/transactions/transaction1',{
                errors:undefined,
                BeneficiaryDisplayname:BeneficiaryDisplayname,
                BeneficiaryNumberAccount:BeneficiaryNumberAccount,
                account:account,
                SoTien:req.body.SoTien,
                content:content,
                fee:fee,
            });  
        }
   }
    
    
    // console.log(res.locals.account.accountNumber)
    // await User.create({

    //     email:'email3@gmail.com',
    //     username:'nguyen van c',
    //     password:'$2b$10$RJaT94d1LWSIUH.fbhdrTuZ1Iv1Xw3a/8ZqgSiSuF4uhluqlYX.vC',
    //     displayName : 'khaidang2',
    //     idCardType:'33',
    //     cardId : '1234567',
    //     provideDate:'2016-08-09 04:05:02',
    // })
    // await Account.create({
    //     accountNumber : '1234567',
    //     balance : 5000000,
    //     currencyUnit:'currencyUnit',
    //     status:true,
    //     openDate:'2016-08-09 04:05:02',
    //     limit:5000000
    // })
    // const currentUser = await User.create({
    //     email: req.body.email,
    //     displayName: req.body.displayName,
    //     password: (await User.hashPassword(req.body.password)).toString(),
    //     token : crypto.randomBytes(3).toString('hex').toUpperCase(),
        
    // })
    // req.session.userId = currentUser.id
    // await Email.send(currentUser.email, 'kich hoat tai khoan' ,`${process.env.BASE_URL}/login/activate/${currentUser.id}/${currentUser.token}`);
    // res.redirect('/')
}));
module.exports =router;