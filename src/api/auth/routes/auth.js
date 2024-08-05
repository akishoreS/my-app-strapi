module.exports = {
  routes: [
    {
     method: 'GET',
     path: '/auth/google',
     handler: 'auth.googleAuth',
     config: {
       policies: [],
       middlewares: [],
     },
    },
    {
     method: 'GET',
     path: '/auth/google/callback',
     handler: 'auth.googleAuthCallback',
     config: {
       policies: [],
       middlewares: [],
     },
    },
    {
     method: 'GET',
     path: '/auth/google/sample',
     handler: 'auth.googleAuthSample',
     config: {
       policies: [],
       middlewares: [],
     },
    },
    {
     method: 'POST',
     path: '/auth/sign_in',
     handler: 'auth.localSingIn',
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
    }
  ],
};
