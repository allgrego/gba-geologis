import {Router} from "express";
import fetch from "cross-fetch";
import {getCountry, paginateData, parseMaerskCities, parseMaerskStreamJson} from "./lib/misc";
// import * as fs from "fs";
// import * as path from "path";

const router = Router();

// Middleware that is specific for these routes
router.use((req, res, next)=>{
  // Cache data for 10 minutes
  res.set("Cache-Control", "public, max-age=600, s-maxage=1200");
  next();
});

/**
 * Query cities by name
 *
 * To be considered: For it is powered by Maersk API it could also find regions, towns, etc
 *
 * @param {urlParam} name: name of city to be searched
 * @param {queryParam} page [optional]: current page
 * @param {queryParam} count [optional]: amount of cities per page
 */
router.get("/name/:name", async (req, res)=>{
  const cityName = req.params.name;
  if (!cityName) {
    res.status(400).json({
      error: {
        status: "invalid-arguments",
        message: "name parameter is required",
      },
    });
    return;
  }

  try {
    const DEFAULT_AMOUNT = 20;
    const MAX_AMOUNT = 100;
    // Maximum amount of items retrieved from Third Party API
    const amount = Number(req.query.queryamount) || DEFAULT_AMOUNT;

    if (amount > MAX_AMOUNT) {
      res.status(400).json({
        error: {
          status: "invalid-arguments",
          message: `queryamount parameter must be less than ${MAX_AMOUNT}`,
        },
      });
      return;
    }

    // Maersk API for cities
    const url = `https://api.maersk.com/locations/?cityName=${cityName}&type=city&pageSize=${amount}&sort=cityName`;
    // const url = `https://api.maersk.com/locations/?brand=maeu&cityName=${cityName}&type=city&pageSize=20&sort=cityName`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (response.ok) {
    // Valid Content Types
      const validContentTypes = {
        streamJson: "application/stream+json",
        stdJson: "application/json",
      };
      // If content is JSON Strem
      if (response.headers.get("Content-Type")?.includes(validContentTypes.streamJson)) {
        //  Get body as a text
        const bodyResponse = await response.text();
        // Parsed Cities JSON Data
        const parsedJsonData = parseMaerskStreamJson(bodyResponse);

        if (!parsedJsonData) {
          res.status(500).json({
            error: {
              status: "internal",
              message: "something went wrong",
            },
          });
          return;
        }
        // Parsed Data to Custom model
        const jsonParsedCities = parseMaerskCities(parsedJsonData);
        // Number of cities
        const totalCities = jsonParsedCities?.length || 0;

        // Number of cities per chunk
        const DEFAULT_COUNT = 5;
        let count : number = Math.floor(+(req.query.count|| DEFAULT_COUNT));
        if (!count||count<1) count = DEFAULT_COUNT;
        if (count>totalCities) count = totalCities;
        // Page from query param (1 by default)
        const page = Number(req.query.page) || 1;
        // Get paginatedData, Total of pages, Page (integer)
        const [paginatedCities, totalPages, currentPage] = paginateData(jsonParsedCities, count, page);
        // Result to be send
        const result = {
          page: currentPage,
          totalPages: totalPages,
          count: count,
          totalCount: totalCities,
          data: paginatedCities,
        };
        // Send results
        res.json(result);
        return;
      }
      // Display error if not valid Content-Type
      res.status(500).json({
        error: {
          status: "internal",
          message: "Something went wrong retrieving cities",
        },
      });
      return;
    }
    // JSON Third Party Response
    const thirdPartyResponse = await response.json();

    // Error for no valid third party response
    res.status(response.status).json({
      error: {
        status: "not-found",
        message: thirdPartyResponse.message||"Invalid arguments",
      },
    });
    return;
  } catch (error) {
    console.log("[ERROR]", error);
    res.status(500).json({
      error: {
        status: "internal",
        message: "Something unknown went wrong",
        support: "You can send us an email to support@gbalogistic.com",
      },
    });
  }
});

/**
 * Query cities by name in a specific country
 * @param {urlParam} name: name of city to be searched
 * @param {urlParam} countryCode: ISO-2 or ISO-3 Code of country in which city will be searched
 * @param {queryParam} page [optional]: current page
 * @param {queryParam} count [optional]: amount of cities per page
 */
router.get("/country/:countryCode/name/:name", async (req, res)=>{
  const cityName = req.params.name;
  const countryCode = req.params.countryCode;

  if (!cityName) {
    res.status(400).json({
      error: {
        status: "invalid-arguments",
        message: "name and countryCode parameters are required",
      },
    });
    return;
  }
  // Retrieve country for given code (ISO2 or ISO3)
  const country = getCountry(countryCode);
  // If invalid country
  if (!country) {
    res.status(400).json({
      error: {
        status: "invalid-arguments",
        message: "A valid ISO alpha-2 or ISO alpha-3 country code must be provided",
      },
    });
    return;
  }

  try {
    const DEFAULT_AMOUNT = 20;
    const MAX_AMOUNT = 100;
    // Maximum amount of items retrieved from Third Party API
    const amount = Number(req.query.queryamount) || DEFAULT_AMOUNT;
    // Amount of items MUST NOT be more than MAX_AMOUNT
    if (amount > MAX_AMOUNT) {
      res.status(400).json({
        error: {
          status: "invalid-arguments",
          message: `queryamount parameter must be less than ${MAX_AMOUNT}`,
        },
      });
      return;
    }

    // Maersk API for cities
    const url = `https://api.maersk.com/locations/?cityName=${cityName}&type=city&pageSize=${amount}&sort=cityName&countryCode=${country.code}`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (response.ok) {
    // Valid Content Types
      const validContentTypes = {
        streamJson: "application/stream+json",
        stdJson: "application/json",
      };
      // If content is JSON Strem
      if (response.headers.get("Content-Type")?.includes(validContentTypes.streamJson)) {
        //  Get body as a text
        const bodyResponse = await response.text();
        // Parsed Cities JSON Data
        const parsedJsonData = parseMaerskStreamJson(bodyResponse);

        if (!parsedJsonData) {
          res.status(500).json({
            error: {
              status: "internal",
              message: "something went wrong",
            },
          });
          return;
        }
        // Parsed Data to Custom model
        const jsonParsedCities = parseMaerskCities(parsedJsonData);
        // Number of cities
        const totalCities = jsonParsedCities?.length || 0;

        // Number of countries per chunk
        const DEFAULT_COUNT = 5;
        let count : number = Math.floor(+(req.query.count|| DEFAULT_COUNT));
        if (!count||count<1) count = DEFAULT_COUNT;
        if (count>totalCities) count = totalCities;
        // Page from query param (1 by default)
        const page = Number(req.query.page) || 1;
        // Get paginatedData, Total of pages, Page (integer)
        const [paginatedCities, totalPages, currentPage] = paginateData(jsonParsedCities, count, page);
        // Result to be send
        const result = {
          page: currentPage,
          totalPages: totalPages,
          count: count,
          totalCount: totalCities,
          data: paginatedCities,
        };
        // Send results
        res.json(result);
        return;
      }
      // Display error if not valid Content-Type
      res.status(500).json({
        error: {
          status: "internal",
          message: "Something went wrong retrieving cities",
        },
      });
      return;
    }
    // JSON Third Party Response
    const thirdPartyResponse = await response.json();

    // Error for no valid third party response
    res.status(response.status).json({
      error: {
        status: "not-found",
        message: thirdPartyResponse.message||"Invalid arguments",
      },
    });
    return;
  } catch (error) {
    console.log("[ERROR]", error);
    res.status(500).json({
      error: {
        status: "internal",
        message: "Something unknown went wrong",
        support: "You can send us an email to support@gbalogistic.com",
      },
    });
  }
});

// router.get("/", async (req, res)=>{
//   const countryCode = String(req.query.countryCode||"ve");
//   const type = String(req.query.type||"depot");
//   const cityName = req.query.cityName;
//   // Retrieve country for given code (ISO2 or ISO3)
//   const country = getCountry(countryCode);
//   // If invalid country
//   if (!country) {
//     res.status(400).json({
//       error: {
//         status: "invalid-arguments",
//         message: "A valid ISO alpha-2 or ISO alpha-3 country code must be provided",
//       },
//     });
//     return;
//   }

//   try {
//     const DEFAULT_AMOUNT = 20;
//     const MAX_AMOUNT = 100;
//     // Maximum amount of items retrieved from Third Party API
//     const amount = Number(req.query.queryamount) || DEFAULT_AMOUNT;
//     // Amount of items MUST NOT be more than MAX_AMOUNT
//     if (amount > MAX_AMOUNT) {
//       res.status(400).json({
//         error: {
//           status: "invalid-arguments",
//           message: `queryamount parameter must be less than ${MAX_AMOUNT}`,
//         },
//       });
//       return;
//     }

//     // Maersk API for cities

//     const url = `https://api.maersk.com/locations/?pageSize=100&countryCode=${countryCode}&type=${type}${(cityName)?`&cityName=${cityName}`:""}`;
//     console.log("URL", url);

//     // const url = `https://api.maersk.com/locations/?cityName=${cityName}&type=city&pageSize=${amount}&sort=cityName&countryCode=${country.code}`;

//     const response = await fetch(url, {
//       method: "GET",
//     });

//     if (response.ok) {
//     // Valid Content Types
//       const validContentTypes = {
//         streamJson: "application/stream+json",
//         stdJson: "application/json",
//       };
//       // If content is JSON Strem
//       if (response.headers.get("Content-Type")?.includes(validContentTypes.streamJson)) {
//         //  Get body as a text
//         const bodyResponse = await response.text();
//         // Parsed Cities JSON Data
//         const parsedJsonData = parseMaerskStreamJson(bodyResponse);

//         if (!parsedJsonData) {
//           res.status(500).json({
//             error: {
//               status: "internal",
//               message: "something went wrong",
//             },
//           });
//           return;
//         }
//         // Parsed Data to Custom model
//         const jsonData = parsedJsonData;
//         // Number of cities
//         const totalCities = jsonData?.length || 0;

//         // Number of countries per chunk
//         const DEFAULT_COUNT = 5;
//         let count : number = Math.floor(+(req.query.count|| DEFAULT_COUNT));
//         if (!count||count<1) count = DEFAULT_COUNT;
//         if (count>totalCities) count = totalCities;
//         // // Page from query param (1 by default)
//         // const page = Number(req.query.page) || 1;
//         // // Get paginatedData, Total of pages, Page (integer)
//         // const [paginatedCities, totalPages, currentPage] = paginateData(jsonData, count, page);
//         // // Result to be send
//         // const result = {
//         //   page: currentPage,
//         //   totalPages: totalPages,
//         //   count: count,
//         //   totalCount: totalCities,
//         //   data: paginatedCities,
//         // };

//         const keys = ["type", "siteName", "countryCode", "countryName", "regionName"];
//         const dataToCsv = jsonData.map((c: any) => {
//           let data = {};
//           keys.forEach((k) => {
//             data = {
//               ...data,
//               [k]: c[k],
//             };
//           });
//           return data;
//         });


//         // Send results
//         res.json({dataToCsv, jsonData});
//         return;
//       }
//       // Display error if not valid Content-Type
//       res.status(500).json({
//         error: {
//           status: "internal",
//           message: "Something went wrong retrieving cities",
//         },
//       });
//       return;
//     }
//     // JSON Third Party Response
//     const thirdPartyResponse = await response.json();

//     // Error for no valid third party response
//     res.status(response.status).json({
//       error: {
//         status: "not-found",
//         message: thirdPartyResponse.message||"Invalid arguments",
//       },
//     });
//     return;
//   } catch (error) {
//     console.log("[ERROR]", error);
//     res.status(500).json({
//       error: {
//         status: "internal",
//         message: "Something unknown went wrong",
//         support: "You can send us an email to support@gbalogistic.com",
//       },
//     });
//   }
// });

export default router;
