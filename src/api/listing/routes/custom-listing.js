'use strict';



module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/listing/save/:listing_id',
      handler: 'api::listing.listing.save_listing',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/listing/unsave/:listing_id',
      handler: 'api::listing.listing.unsave_listing',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ]
}
