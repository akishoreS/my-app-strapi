'use strict';

/**
 * A set of functions called "actions" for `auth`
 */

const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios')

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URL = process.env.REDIRECT_URL;
const JWT_SECRET = process.env.JWT_SECRET
const OTP_CLIENT_ID = process.env.OTP_CLIENT_ID
const OTP_CLIENT_SECRET = process.env.OTP_CLIENT_SECRET


const apiClient = axios.create({
  baseURL: "https://auth.otpless.app/auth/v1",
  headers: {
    "Content-Type": "application/json",
    clientId: OTP_CLIENT_ID,
    clientSecret: OTP_CLIENT_SECRET,
  },
});
module.exports = {
  googleAuth: async (ctx, next) => {
    try {
      const client = new OAuth2Client(
        CLIENT_ID,
        CLIENT_SECRET
      );
      const scopes = [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ];

      const authUrl = client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        redirect_uri: REDIRECT_URL,
      });

      ctx.redirect(authUrl);
    } catch (err) {
      ctx.body = err;
    }
  },
  googleAuthCallback: async (ctx, next) => {
    try {
      const { code } = ctx.query;
      const client = new OAuth2Client(
        CLIENT_ID,
        CLIENT_SECRET
      );
      const { tokens } = await client.getToken({
        code,
        redirect_uri: REDIRECT_URL,
      });
      client.setCredentials(tokens);
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: CLIENT_ID,
      });

      console.log(tokens, "Token")

      const payload = ticket.getPayload();
      console.log(payload, "playload")
      const userId = payload["sub"];
      const email = payload["email"];
      const firstName = payload["given_name"];
      const lastName = payload["family_name"];
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
            role: authenticatedRole.id
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
      ctx.body = err;
    }
  },
  googleAuthSample: async (ctx, next) => {
    try {
      console.log(ctx.state.user)
      const data = await strapi.entityService.findMany('plugin::users-permissions.role', {
        fields: ['name', 'description'],
      });
      return data;
    } catch (err) {
      ctx.body = err;
    }
  },
  localSignIn: async (ctx, next) => {
    try {
      const { mobile_no } = ctx.request.body;

      const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });

      let userData = await strapi.query('plugin::users-permissions.user').findOne({
        where: { mobile_no: mobile_no },
      });

      if (!userData) {
        userData = await strapi.query('plugin::users-permissions.user').create({
          data: {
            mobile_no: mobile_no,
            role: authenticatedRole.id,
          },
        });
      }

      const otpLessData = await apiClient.post('/initiate/otp', {
        phoneNumber: mobile_no,
        otpLength: 6,
        channels: ["SMS"],
      });

      const otpResponseData = otpLessData?.data ?? null;

      if (!otpResponseData?.requestId) {
        ctx.send({
          status: false,
          message: "OTP not sent.",
        }, 400);
        return;
      }

      const otpData = await strapi.query('api::otp.otp').create({
        data: {
          otpLess_request_id: otpResponseData.requestId,
          userId: userData.id,
        },
      });

      ctx.send({
        status: true,
        message: "OTP successfully sent.",
        data: otpData,
      }, 200);

      return userData;

    } catch (err) {
      console.error('Error in localSignIn:', err);
      ctx.send({
        status: false,
        message: 'An error occurred during the sign-in process.',
        error: err.message || 'Unknown error',
      }, 500);
    }
  },
  otpVerify: async (ctx, next) => {
    try {
      const { otp } = ctx.request.body;
      const { otpId } = ctx.params;

      const otpExist = await strapi.query('api::otp.otp').findOne({
        where: { otpLess_request_id: otpId },
        select: ['id', 'otpLess_request_id'],
        populate: { user_id: { fields: ['id', 'email'] } }
      });
      if (!otpExist) {
        return ctx.send({ status: false, message: "Otp Not Found." }, 404);
      }

      const verifyOtpResponse = await apiClient.post('/verify/otp', {
        requestId: otpId,
        otp: otp
      })

      const verifyOtpData = verifyOtpResponse?.data ?? null;
      if (!verifyOtpData?.isOTPVerified) {
        return ctx.send({ status: false, message: "Otp Is Invalid." }, 400);
      }

      // Find user by primary key (id)
      const userData = await strapi.query('plugin::users-permissions.user').findOne({ where: { id: otpExist.user_id.id } });

      if (!userData) {
        return ctx.send({ status: false, message: "User Not Found." }, 404);
      }

      const payload = {
        id: userData.id
      };

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
      console.error('Error:', err);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
    }
  },
  updateMobileNo: async (ctx, next) => {
    try {
      const { mobileNo } = ctx.request.body;
      const { user } = ctx.state;
      const otp = Math.floor(100000 + Math.random() * 900000);
      const otpData = await strapi.query('api::otp.otp').create({
        data: {
          user_id: user.id,
          otp: otp,
          change_mobileNo: mobileNo
        },
      });

      ctx.send({
        status: true,
        message: "Otp Successfully Sent.",
        data: otpData,
      }, 200);

    } catch (err) {
      console.error('Error:', err);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
    }
  },
  verifyMobileNno: async (ctx, next) => {
    try {
      const { otp } = ctx.request.body;
      const { otpId } = ctx.params;
      const {user} = ctx.state;

      const otpExist = await strapi.query('api::otp.otp').findOne({
        where: { id: otpId },
        select: ['id', 'otp', 'change_mobileNo'],
        populate: { user_id: { fields: ['id', 'email'] } }
      });
      if (!otpExist) {
        return ctx.send({ status: false, message: "Otp Not Found." }, 404);
      }

      if (otpExist.otp !== otp) {
        return ctx.send({ status: false, message: "Otp Is Invalid." }, 400);
      }

      // Find user by primary key (id)
      const userData = await strapi.query('plugin::users-permissions.user').findOne({ where: { id: otpExist.user_id.id } });

      if (!userData) {
        return ctx.send({ status: false, message: "User Not Found." }, 404);
      }

      const data = await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          mobile_no: otpExist.change_mobileNo
        }
      })
      await strapi.query('api::otp.otp').delete({ where: { id: otpId } });

      return ctx.send({
        status: true,
        message: "User Update Successfully.",
        data: data
      }, 200);

    } catch (err) {
      console.error('Error:', err);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
    }
  },
  updateEmail: async (ctx, next) => {
    try {
      const { email } = ctx.request.body;
      const { user } = ctx.state;
      const otp = Math.floor(100000 + Math.random() * 900000);
      const otpData = await strapi.query('api::otp.otp').create({
        data: {
          user_id: user.id,
          otp: otp,
          change_email: email
        },
      });

      ctx.send({
        status: true,
        message: "Otp Successfully Sent.",
        data: otpData,
      }, 200);

    } catch (err) {
      console.error('Error:', err);
      return ctx.send({ status: false, message: "Internal Server Error.", error: err }, 500);
    }
  },
  verifyEmail: async (ctx, next) => {
    try {
      const { otp } = ctx.request.body;
      const { otpId } = ctx.params;
      const {user} = ctx.state;

      const otpExist = await strapi.query('api::otp.otp').findOne({
        where: { id: otpId },
        select: ['id', 'otp', 'change_email'],
        populate: { user_id: { fields: ['id', 'email'] } }
      });
      if (!otpExist) {
        return ctx.send({ status: false, message: "Otp Not Found." }, 404);
      }

      if (otpExist.otp !== otp) {
        return ctx.send({ status: false, message: "Otp Is Invalid." }, 400);
      }

      // Find user by primary key (id)
      const userData = await strapi.query('plugin::users-permissions.user').findOne({ where: { id: otpExist.user_id.id } });

      if (!userData) {
        return ctx.send({ status: false, message: "User Not Found." }, 404);
      }

      const data = await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          email: otpExist.change_email
        }
      })
      await strapi.query('api::otp.otp').delete({ where: { id: otpId } });

      return ctx.send({
        status: true,
        message: "User Update Successfully.",
        data: data
      }, 200);

    } catch (err) {
      console.error('Error:', err);
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
      const lastName = userInfo["family_name"];
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
