'use strict';

/**
 * A set of functions called "actions" for `auth`
 */

const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios')

const JWT_SECRET = process.env.JWT_SECRET
const OTP_CLIENT_ID='T95VQTHVJ5F6CXFO7OLQ2KBHSA39AXRC'
const OTP_CLIENT_SECRET='bs68sdzd8pixq10l4egg6eexmb0xayc1'


const apiClient = axios.create({
  baseURL: "https://auth.otpless.app/auth/otp/v1",
  headers: {
    "Content-Type": "application/json",
    clientId: OTP_CLIENT_ID,
    clientSecret: OTP_CLIENT_SECRET,
  },
});
module.exports = {
  localSignIn: async (ctx, next) => {
    try {
      const { mobile_no } = ctx.request.body;
  
      const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });
  
      const formattedMobileNo = mobile_no.startsWith('+') ? mobile_no : `+${mobile_no}`;
  
      // Check if the user already exists
      let userData = await strapi.query('plugin::users-permissions.user').findOne({
        where: { mobile_no: formattedMobileNo },
      });
  
      // If user does not exist, create a new user
      if (!userData) {
        userData = await strapi.query('plugin::users-permissions.user').create({
          data: {
            mobile_no: formattedMobileNo,
            role: authenticatedRole.id,
          },
        });
      }
  
      // Send OTP using the external service
      const otpLessData = await apiClient.post('/send', {
        phoneNumber: formattedMobileNo,
        otpLength: 6,
        channels: ["SMS"],
      });
  
      // Log full OTP response
      console.log('OTP Less Data:', otpLessData);
  
      const otpResponseData = otpLessData?.data ?? null;
  
      // Check if the OTP service returned a valid orderId
      if (!otpResponseData?.orderId) {
        console.log('Error: No requestId returned by OTP service', otpResponseData); // Log what was returned
        ctx.send({
          status: false,
          message: "OTP not sent.",
        }, 400);
        return;
      }
  
      // Save the OTP record in the database
      const otpData = await strapi.query('api::otp.otp').create({
        data: {
          otpLess_request_id: otpResponseData.orderId,
          user_id: userData.id,  // Ensure consistent naming here
        },
      });
  
      // Send success response with OTP data
      ctx.send({
        status: true,
        message: "OTP successfully sent.",
        data: otpData,
      }, 200);
  
      return userData;
  
    } catch (err) {
      console.error('Error in localSignIn:', err);
  
      if (err.response) {
        console.log('API Error:', err.response.data); // Log API error response
        ctx.send({
          status: false,
          message: 'OTP service error: ' + (err.response.data.message || 'Unknown error'),
          error: err.response.data,
        }, err.response.status || 500);
      } else {
        ctx.send({
          status: false,
          message: 'An error occurred during the sign-in process.',
          error: err.message || 'Unknown error',
        }, 500);
      }
    }
  },
  otpVerify: async (ctx, next) => {
    try {
      const { otp } = ctx.request.body;
      const { otpId } = ctx.params;

      const otpExist = await strapi.query('api::otp.otp').findOne({
        where: { otpLess_request_id: otpId },
        select: ['id', 'otpLess_request_id'],
        populate: { user_id: { fields: ['id', 'mobile_no', 'email'] } }
      });

      if (!otpExist) {
        return ctx.send({ status: false, message: "Otp Not Found." }, 404);
      }
  
      if (!otpExist.user_id || !otpExist.user_id.mobile_no) {
        return ctx.send({ status: false, message: "User data is missing or incomplete." }, 400);
      }
  
      console.log('Verifying OTP:', {
        orderId: otpId,
        otp: otp,
        phoneNumber: otpExist.user_id.mobile_no
      });
  
      const verifyOtpResponse = await apiClient.post('/verify', {
        orderId: otpId,
        otp: otp,
        phoneNumber: otpExist.user_id.mobile_no
      });
      console.log('OTP Verification Response:', verifyOtpResponse.data);
  
      const verifyOtpData = verifyOtpResponse?.data ?? null;
  
      if (!verifyOtpData?.isOTPVerified) {
        return ctx.send({ status: false, message: "Otp Is Invalid." }, 400);
      }

      const userData = await strapi.query('plugin::users-permissions.user').findOne({ where: { id: otpExist.user_id.id } });
  
      if (!userData) {
        return ctx.send({ status: false, message: "User Not Found." }, 404);
      }
  
      const payload = { id: userData.id };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

      await strapi.query('api::otp.otp').delete({ where: { otpLess_request_id: otpId } });

      await strapi.entityService.create('api::app-user.app-user', {
        data: {
          user_id: userData.id,
          token: token,
          type_login: "Mobile_no",
          publishedAt: new Date()
        }
      });
  
      return ctx.send({
        status: true,
        message: "Otp is Valid.",
        data: { user: userData, token }
      }, 200);
  
    } catch (err) {
      console.error('Error:', err.response ? err.response.data : err.message);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err.response ? err.response.data : err.message }, 500);
    }
  },
  verifyMobileNo: async (ctx, next) => {
    try {
      const { otp } = ctx.request.body;
      const { otpId } = ctx.params;
      const { user } = ctx.state;
  
      // Fetch the OTP record with the requestId and new mobile number
      const otpRecord = await strapi.query('api::otp.otp').findOne({
        where: { otpLess_request_id: otpId },
        select: ['id', 'otpLess_request_id','change_mobileNo'],
        populate: { user_id: { fields: ['id', 'mobile_no'] } }
      });
  
      if (!otpRecord) {
        return ctx.send({ status: false, message: "OTP not found." }, 404);
      }
  
      // Verify the OTP via the external OTP-less service
      const verifyOtpResponse = await apiClient.post('/verify', {
        phoneNumber: otpRecord.change_mobileNo,
        orderId: otpId,
        otp:otp, // User-entered OTP
      });

      const verifyOtpData = verifyOtpResponse?.data ?? null;
  
      if (!verifyOtpData?.isOTPVerified) {
        return ctx.send({ status: false, message: "Otp Is Invalid." }, 400);
      }
      else{
        // Update user with the new email if OTP is valid
        const updatedUser = await strapi.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: {
            mobile_no: otpRecord.change_mobileNo,
          }
        });
  
        // Delete OTP record after successful verification
        await strapi.query('api::otp.otp').delete({ where: { otpLess_request_id : otpId } });
  
        return ctx.send({
          status: true,
          message: "Mobile no. updated Successfully.",
          data: updatedUser,
        }, 200);
  
      }
  
    } catch (err) {
      console.error('Error in verifyMobileNo:', err);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
    }
  },
  
  updateMobileNo: async (ctx, next) => {
    try {
      const { mobileNo } = ctx.request.body;
      const { user } = ctx.state;
  
      const formattedMobileNo = mobileNo.startsWith('+') ? mobileNo : `+${mobileNo}`;
  
      // Request OTP-less to send OTP to the new mobile number
      const otpLessData = await apiClient.post('/send', {
        phoneNumber: formattedMobileNo,
        otpLength: 6, // Number of digits in the OTP
        channels: ["SMS"], // Send via SMS
      });
  
      const otpResponseData = otpLessData?.data ?? null;
  
      if (!otpResponseData?.orderId) {
        return ctx.send({
          status: false,
          message: "OTP could not be sent.",
        }, 400);
      }
  
      // Save OTP-less requestId and the new mobile number for verification
      const otpData = await strapi.query('api::otp.otp').create({
        data: {
          user_id: user.id,
          otpLess_request_id: otpResponseData.orderId, // Save requestId for later verification
          change_mobileNo: formattedMobileNo, // Save new mobile number for later update
        },
      });
  
      return ctx.send({
        status: true,
        message: "OTP Successfully Sent.",
        data: otpData,
      }, 200);
  
    } catch (err) {
      console.error('Error in updateMobileNo:', err);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
    }
  },
  
  // verifyMobileNo: async (ctx, next) => {
  //   try {
  //     const { otp } = ctx.request.body;
  //     const { otpId } = ctx.params;
  //     const { user } = ctx.state;
  
  //     // Fetch the OTP record with the requestId and new mobile number
  //     const otpRecord = await strapi.query('api::otp.otp').findOne({
  //       where: { otpLess_request_id: otpId },
  //       select: ['id', 'otpLess_request_id', 'change_mobileNo'],
  //       populate: { user_id: { fields: ['id', 'email'] } }
  //     });
  
  //     if (!otpRecord) {
  //       return ctx.send({ status: false, message: "OTP not found." }, 404);
  //     }
  
  //     // Verify the OTP via the external OTP-less service
  //     const otpVerificationResponse = await apiClient.post('/verify', {
  //       phoneNumber: otpRecord.change_mobileNo,
  //       orderId : otpId,
  //       otp, // User-entered OTP
  //     });
  //     if (otpVerificationResponse?.isOTPVerified) {
  //       // Update user with the new mobile number if OTP is valid
  //       const updatedUser = await strapi.query('plugin::users-permissions.user').update({
  //         where: { id: user.id },
  //         data: {
  //           mobile_no: otpRecord.change_mobileNo,
  //         }
  //       });
  
  //       // Delete OTP record after successful verification
  //       await strapi.query('api::otp.otp').delete({ where: { id: otpId } });
  
  //       return ctx.send({
  //         status: true,
  //         message: "Mobile number updated successfully.",
  //         data: updatedUser,
  //       }, 200);
  
  //     } else {
  //       return ctx.send({
  //         status: false,
  //         message: "Invalid OTP.",
  //       }, 400);
  //     }
  
  //   } catch (err) {
  //     console.error('Error in verifyMobileNo:', err);
  //     return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
  //   }
  // },
  
  updateEmail: async (ctx, next) => {
    try {
      const { email } = ctx.request.body;
      const { user } = ctx.state;
  
      // Assuming you have an OTP-less API that can handle email verification
      const otpLessData = await apiClient.post('/send', {
        email, // Send OTP to the new email address
        otpLength: 6, // Number of digits in the OTP
        channels: ["EMAIL"], // Send via email
      });
  
      const otpResponseData = otpLessData?.data ?? null;
  
      if (!otpResponseData?.orderId) {
        return ctx.send({
          status: false,
          message: "OTP could not be sent.",
        }, 400);
      }
  
      // Save OTP-less requestId and the new email for verification
      const otpData = await strapi.query('api::otp.otp').create({
        data: {
          user_id: user.id,
          otpLess_request_id: otpResponseData.orderId, // Save requestId for later verification
          change_email: email, // Save new email for later update
        },
      });
  
      return ctx.send({
        status: true,
        message: "OTP Successfully Sent.",
        data: otpData,
      }, 200);
  
    } catch (err) {
      console.error('Error in updateEmail:', err);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
    }
  },
  
  verifyEmail: async (ctx, next) => {
    try {
      const { otp } = ctx.request.body;
      const { otpId } = ctx.params;
      const { user } = ctx.state;
  
      // Fetch the OTP record with the requestId and new email
      const otpRecord = await strapi.query('api::otp.otp').findOne({
        where: { otpLess_request_id: otpId },
        select: ['id', 'otpLess_request_id', 'change_email'],
        populate: { user_id: { fields: ['id', 'email'] } }
      });
  
      if (!otpRecord) {
        return ctx.send({ status: false, message: "OTP not found." }, 404);
      }
  
      // Verify the OTP via the external OTP-less service
      const verifyOtpResponse = await apiClient.post('/verify', {
        email: otpRecord.change_email,
        orderId: otpId,
        otp:otp, // User-entered OTP
      });

      const verifyOtpData = verifyOtpResponse?.data ?? null;
  
      if (!verifyOtpData?.isOTPVerified) {
        return ctx.send({ status: false, message: "Otp Is Invalid." }, 400);
      }
      else{
        // Update user with the new email if OTP is valid
        const updatedUser = await strapi.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: {
            email: otpRecord.change_email,
          }
        });
  
        // Delete OTP record after successful verification
        await strapi.query('api::otp.otp').delete({ where: {otpLess_request_id: otpId } });
  
        return ctx.send({
          status: true,
          message: "Email updated successfully.",
          data: updatedUser,
        }, 200);
  
      }
  
    } catch (err) {
      console.error('Error in verifyEmail:', err);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
    }
  },
  
  googleAccessToken: async (ctx, next) => {
    try {
      const { accessToken } = ctx.request.body;
      if(!accessToken){
        return ctx.send({ status: false, message: "Access Token is required." }, 400);
      }
      const googleRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userInfo = googleRes?.data ?? null;
      if(!userInfo){
        return ctx.send({ status: false, message: "Something went wrong." }, 400);
      }
      const email = userInfo["email"];
      const firstName = userInfo["given_name"];
      const lastName = userInfo["family_name"]|| 'N/A';
      let userData = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: email },
      });
      const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });
      if(!userData){
        userData =await strapi.entityService.create('plugin::users-permissions.user', {
          data: {
            email: email,
            first_name: firstName,
            last_name: lastName,
            username: firstName,
            confirmed: true,
            role: authenticatedRole.id,
            password: email
          }
        });
      }
      const tokenPayload = {
        id: userData.id
      };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '30d' });
      await strapi.entityService.create('api::app-user.app-user', {
        data: {
          user_id: userData.id,
          token: token,
          type_login: "Google",
          role: authenticatedRole.id,
          publishedAt: new Date()
        }
      });

      ctx.send({
        status: true,
        message: "Successfully google sign in.",
        data: {userData, token: token},
      }, 200);

    } catch (err) {
      console.error('Error:', err);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
    }
  },
};
