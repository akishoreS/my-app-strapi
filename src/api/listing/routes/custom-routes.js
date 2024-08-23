module.exports = {
    routes: [
      {
        method: 'GET',
        path: '/my-listings',
        handler: 'listing.findMyListings',
        config: {
          policies: [],
          middlewares: [],
        },
      },
      {
        method: 'GET',
        path: '/listings',
        handler: 'listing.find',
        config: {
          policies: [],
          middlewares: [],
        },
      },
      {
        method: 'GET',
        path: '/listings/:id',
        handler: 'listing.findOne',
        config: {
          policies: [],
          middlewares: [],
        },
      },
      {
        method: 'GET',
        path: '/listing/toggle/:listing_id',
        handler: 'api::listing.listing.toggle_save_listing',
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };