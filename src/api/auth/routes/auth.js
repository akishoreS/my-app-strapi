module.exports = {
  routes: [
    {
     method: 'POST',
     path: '/auth/sign_in',
     handler: 'auth.localSignIn',
     config: {
       policies: [],
       middlewares: [],
     },
    },
    {
      method: 'POST',
      path: '/auth/otp_verify/:otpId',
      handler: 'auth.otpVerify',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/update_mobile_no',
      handler: 'auth.updateMobileNo',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/verify_mobile_no/:otpId',
      handler: 'auth.verifyMobileNo',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/update_email',
      handler: 'auth.updateEmail',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/verify_email/:otpId',
      handler: 'auth.verifyEmail',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/google_access_token',
      handler: 'auth.googleAccessToken',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/auth/delete_account',
      handler: 'auth.deleteAccount',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/auth/profile',
      handler: 'auth.updateProfile',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ],
};
