import * as joi from 'joi';

export const eachHouseOnMatrixPageTemplate = joi.object().keys({
  success: joi
    .boolean()
    .invalid(false)
    .required(),
  error: joi.valid(null).required(),
  data: {
    familyData: joi.string().required(),
    familyName: joi.string().required(),
    activeThing: {
      originPlural: joi.string().required(),
      originThingName: joi.string().required(),
      plural: joi.string().required(),
      thingName: joi.string().required(),
      _id: joi.string().required()
    },
    country: {
      alias: joi.string().required(),
      country: joi.string().required(),
      originName: joi.string().required(),
      _id: joi.string().required()
    },
    familyImage: {
      thing: joi
        .string()
        .required()
        .optional(),
      url: joi
        .string()
        .required()
        .optional(),
      _id: joi
        .string()
        .required()
        .optional()
    },
    houseImage: joi.any(),
    photographer: {
      id: joi.string().required(),
      name: joi.string().required()
    }
  }
});

export const allHousesOnMatrixPageTemplate = joi.object().keys({
  background: joi.string().required(),
  country: joi.string().required(),
  image: joi.string().required(),
  date: joi.date().required(),
  income: joi.number().required(),
  incomeQuality: joi.number().required(),
  lat: joi.number().required(),
  lng: joi.number().required(),
  region: joi.string().required(),
  showIncome: joi.number().required(),
  _id: joi.string().required()
});

export const eachHousePageDataTemplate = joi.object().keys({
  success: joi
    .boolean()
    .invalid(false)
    .required(),
  error: joi.valid(null).required(),
  msg: joi.array().required(),
  data: {
    images: joi
      .array()
      .items()
      .allow({
        background: joi.string().required(),
        plural: joi.string().required(),
        thing: joi.string().required(),
        thingCategory: joi.string().required(),
        thingIcon: joi.string().required(),
        thingName: joi.string().required(),
        _id: joi.string().required()
      }),
    photographer: {
      _id: joi.string().required(),
      firstName: joi.string().required(),
      lastName: joi.string().required()
    }
  },
  houseId: joi.any()
});

export const eachHouseHeaderInfoTemplate = joi.object().keys({
  success: joi
    .boolean()
    .invalid(false)
    .required(),
  error: joi.valid(null).required(),
  msg: joi.array().required(),
  data: {
    familyInfo: joi.string().required(),
    familyInfoSummary: joi.string().required(),
    familyName: joi.string().required(),
    familyThingId: joi.string().required(),
    image: joi.string().required(),
    income: joi.number().required(),
    _id: joi.string().required(),
    aboutData: joi.string().required(),
    author: joi.string().required(),
    commonAboutData: joi.any(),
    country: {
      alias: joi.string().required(),
      lat: joi.number().required(),
      lng: joi.number().required(),
      originName: joi.string().required(),
      region: joi.string().required(),
      _id: joi.string().required()
    },
    thing: {
      originPlural: joi.string().required(),
      originThingName: joi.string().required(),
      plural: joi.string().required(),
      thingName: joi.string().required(),
      _id: joi.string().required()
    }
  },
  houseId: joi.any()
});

export const photographerProfileDataTemplate = joi.object().keys({
  success: joi
    .boolean()
    .invalid(false)
    .required(),
  error: joi.valid(null).required(),
  msg: joi.array().required(),
  data: {
    avatar: joi
      .string()
      .required()
      .allow('')
      .allow(null),
    description: joi.string(),
    company: {
      link: joi.string().uri(),
      name: joi.string(),
      description: joi.string().allow('')
    },
    facebook: joi
      .string()
      .uri()
      .allow(''),
    google: joi
      .string()
      .uri()
      .allow(''),
    linkedIn: joi.string().uri(),
    twitter: joi.string().uri(),
    firstName: joi.string().required(),
    imagesCount: joi.number().required(),
    lastName: joi.string().required(),
    placesCount: joi.number().required(),
    _id: joi.string().required(),
    country: {
      alias: joi.string().required(),
      country: joi.string().required(),
      _id: joi.string().required(),
      translations: joi.array().required()
    }
  }
});

export const photographerProfilePreviewTemplate = joi.object().keys({
  name: joi.string().required(),
  userId: joi.string().required(),
  avatar: joi
    .string()
    .required()
    .allow(null),
  images: joi
    .number()
    .greater(0)
    .required(),
  places: joi
    .number()
    .greater(0)
    .required()
});

export const coreTeamPreviewTemplate = joi.object().keys({
  name: joi.string().required(),
  company: joi
    .object()
    .keys({
      name: joi
        .string()
        .required()
        .optional(),
      link: joi
        .string()
        .uri()
        .optional()
    })
    .optional(),
  country: joi.string().required(),
  description: joi.string().required(),
  avatar: joi
    .string()
    .required()
    .allow(null),
  priority: joi
    .number()
    .greater(0)
    .required(),
  originName: joi.string().required()
});

export const contributorsPreviewTemplate = coreTeamPreviewTemplate.keys({
  priority: joi
    .number()
    .only(0)
    .required()
});

export const langFormatTemplate = joi.object().keys({
  code: joi.string().required(),
  name: joi.string().required(),
  _id: joi
    .string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
});

export const mapPageCommon = joi.object().keys({
  data: joi.object().required(),
  error: joi.valid(null).required(),
  msg: joi.array().required(),
  success: joi
    .boolean()
    .truthy()
    .required()
});

export const mapPlacesTemplate = joi.object().keys({
  country: joi.string().required(),
  countryOriginName: joi.string().required(),
  family: joi.string().required(),
  familyImg: joi.object().keys({
    background: joi.string().required(),
    imageId: joi.string().required(),
    thing: joi.string().required()
  }),
  income: joi.number().required(),
  lat: joi.number().required(),
  lng: joi.number().required(),
  locationId: joi.string().required(),
  region: joi.string().required(),
  _id: joi
    .string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
});

export const mapCountriesTemplate = joi.array().items(
  joi
    .object({
      letter: joi.string().required(),
      countries: joi.array().items(
        joi.object({
          name: joi.string().required(),
          _id: joi
            .string()
            .required()
            .regex(/^[0-9a-fA-F]{24}$/)
        })
      )
    })
    .required()
);

export const onboardingStepsFormatTemplate = joi.object().keys({
  description: joi.string().required(),
  header: joi
    .string()
    .required()
    .allow(''),
  name: joi.string().required(),
  _id: joi
    .string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
});
