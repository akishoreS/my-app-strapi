module.exports = {
    routes: [
      {
        method: 'GET',
        path: '/my-listings',
        handler: 'listing.findMyListings',
        config: {
          policies: [],
        },
      },
      {
        method: 'GET',
        path: '/listings/:id/reviews',
        handler: 'listing.getListingReviews',
        config: {
          policies: [],
        },
      },
      {
        method: 'GET',
        path: '/listings',
        handler: 'listing.find',
        config: {
          auth: false,
        },
      },
      {
        method: 'GET',
        path: '/listings/:id',
        handler: 'listing.findOne',
        config: {
          auth: false,
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