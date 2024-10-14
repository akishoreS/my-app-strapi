import type { Schema, Attribute } from '@strapi/strapi';

export interface UserReviewUserReview extends Schema.Component {
  collectionName: 'components_user_review_user_reviews';
  info: {
    displayName: 'user_review';
    icon: 'file';
  };
  attributes: {
    rating: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 5;
        },
        number
      >;
    review: Attribute.Blocks;
    admin_user: Attribute.Relation<
      'user-review.user-review',
      'oneToOne',
      'admin::user'
    >;
  };
}

export interface UserInfoUserDetails extends Schema.Component {
  collectionName: 'components_user_info_user_details';
  info: {
    displayName: 'user_details';
    icon: 'user';
    description: '';
  };
  attributes: {
    user_name: Attribute.String & Attribute.Required;
    company_name: Attribute.String & Attribute.Required;
    country_code: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'+91'>;
    phone_number: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 10;
      }>;
    user_city: Attribute.String & Attribute.Required;
    user_address: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
    compnay_logo_url: Attribute.String;
    previous_work_details_url: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
  };
}

export interface SiteInfoSiteDetails extends Schema.Component {
  collectionName: 'components_site_info_site_details';
  info: {
    displayName: 'site_details';
    icon: 'pin';
    description: '';
  };
  attributes: {
    site_description: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
    site_total_area: Attribute.Decimal & Attribute.DefaultTo<0>;
    site_blueprint_url: Attribute.Text;
  };
}

export interface ProperyReviewPropertyReview extends Schema.Component {
  collectionName: 'components_prop_review_prop_reviews';
  info: {
    displayName: 'prop_rev';
    icon: 'file';
  };
  attributes: {
    rating: Attribute.Integer &
      Attribute.SetMinMax<
        {
          min: 1;
          max: 5;
        },
        number
      >;
    review: Attribute.Blocks;
    admin_user: Attribute.Relation<
      'propery-review.property-review',
      'oneToOne',
      'admin::user'
    >;
  };
}

export interface ResourcesResources extends Schema.Component {
  collectionName: 'components_resources_resources';
  info: {
    displayName: 'Resources';
    icon: 'filePdf';
    description: '';
  };
  attributes: {
    investment_memo_url: Attribute.Text;
    financial_calculator_url: Attribute.Text;
  };
}

export interface PropertyPropertyDetails extends Schema.Component {
  collectionName: 'components_property_property_details';
  info: {
    displayName: 'property_details';
    icon: 'pinMap';
    description: '';
  };
  attributes: {
    property_overview: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
    Property_Photos: Attribute.JSON;
  };
}

export interface PricingAmount extends Schema.Component {
  collectionName: 'components_amount_amounts';
  info: {
    displayName: 'pricing';
    icon: 'database';
    description: '';
  };
  attributes: {
    total_amount: Attribute.Integer & Attribute.DefaultTo<0>;
    amount_breakdown: Attribute.Component<'amount.amount-breakage', true>;
  };
}

export interface LocationDetailsLocation extends Schema.Component {
  collectionName: 'components_locationdetails_locations';
  info: {
    displayName: 'Location';
    icon: 'pinMap';
    description: '';
  };
  attributes: {
    Latitude: Attribute.Float;
    Longitude: Attribute.Float;
    Address: Attribute.Text;
  };
}

export interface InvestmentInvestmentThesis extends Schema.Component {
  collectionName: 'components_investment_investment_theses';
  info: {
    displayName: 'investment_thesis';
    icon: 'priceTag';
    description: '';
  };
  attributes: {
    header: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
    description: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
  };
}

export interface InvestmentInvestmentDetails extends Schema.Component {
  collectionName: 'components_investment_investment_details';
  info: {
    displayName: 'Investment_details';
    icon: 'stack';
    description: '';
  };
  attributes: {
    current_funding_details: Attribute.Text &
      Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
    investment_thesis: Attribute.Component<
      'investment.investment-thesis',
      true
    >;
    investment_deck_url: Attribute.Text;
    financial_plan_url: Attribute.Text;
  };
}

export interface AmountAmountBreakage extends Schema.Component {
  collectionName: 'components_amount_amount_breakages';
  info: {
    displayName: 'amount_breakage';
    icon: 'layer';
    description: '';
  };
  attributes: {
    expense_type: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
    cost: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface AdminUseForAdminUseOnly extends Schema.Component {
  collectionName: 'components_admin_use_for_admin_use_onlies';
  info: {
    displayName: 'for_admin_use_only';
    icon: 'lock';
    description: '';
  };
  attributes: {
    property_review: Attribute.Component<
      'propery-review.property-review',
      true
    >;
    user_review: Attribute.Component<'user-review.user-review', true>;
    totally_funded: Attribute.Boolean & Attribute.DefaultTo<false>;
    target_irr: Attribute.Decimal &
      Attribute.SetMinMax<
        {
          max: 100;
        },
        number
      >;
    yield: Attribute.Decimal &
      Attribute.SetMinMax<
        {
          max: 100;
        },
        number
      >;
    asset_value: Attribute.Decimal;
    funded_value: Attribute.Decimal;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'user-review.user-review': UserReviewUserReview;
      'user-info.user-details': UserInfoUserDetails;
      'site-info.site-details': SiteInfoSiteDetails;
      'propery-review.property-review': ProperyReviewPropertyReview;
      'resources.resources': ResourcesResources;
      'property.property-details': PropertyPropertyDetails;
      'pricing.amount': PricingAmount;
      'location-details.location': LocationDetailsLocation;
      'investment.investment-thesis': InvestmentInvestmentThesis;
      'investment.investment-details': InvestmentInvestmentDetails;
      'amount.amount-breakage': AmountAmountBreakage;
      'admin-use.for-admin-use-only': AdminUseForAdminUseOnly;
    }
  }
}
