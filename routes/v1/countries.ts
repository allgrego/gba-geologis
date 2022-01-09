// import {https, logger} from "firebase-functions";
import {Router} from "express";
import {Country} from "./lib/interfaces";
import {getAllCountries, getCount, getCountry, paginateData} from "./lib/misc";

const router = Router();

// Middleware that is specific for these routes
router.use((req, res, next)=>{
  // Cache data for 1 hour
  res.set("Cache-Control", "public, max-age=1800, s-maxage=3600");
  next();
});

/**
 * All countries
 * @param {queryParam} order: default "asc", alphabetically order (alt option: "desc")
 * @param {queryParam} page: current page
 * @param {queryParam} count: number of countries per page
 */
router.get("/", (req, res)=>{
  // Sort query params
  const DEFAULT_SORT_ORDER = "asc";
  const ALT_SORT_ORDER = "desc";
  let order : string = req.query.order?.toString()|| DEFAULT_SORT_ORDER;
  if (!order||order!==ALT_SORT_ORDER) order = DEFAULT_SORT_ORDER;

  // Function to sort alphabetically (order: asc [A->Z] or des [Z->A])
  const compare = (prop: string, order = DEFAULT_SORT_ORDER) =>
    (a: any, b: any) =>{
      if (a[prop] > b[prop]) {
        return order===DEFAULT_SORT_ORDER?1:-1;
      }
      if (b[prop] > a[prop]) {
        return order===DEFAULT_SORT_ORDER?-1:1;
      }
      return 0;
    };
  const countries = getAllCountries();
  if (!countries) {
    res.status(500).json({
      error: {
        status: "internal",
        message: "An error occurred retrieving countries info",
      },
    });
    return;
  }
  // Sorted countries
  const allCountries = countries.sort( compare("code", order));
  // Number of countries
  const totalCountries = allCountries.length;

  // Number of countries per chunk
  const DEFAULT_COUNT = 5;
  let count : number = Math.floor(+(req.query.count|| DEFAULT_COUNT));
  if (!count||count>totalCountries||count<1) count = DEFAULT_COUNT;

  const [data, totalPages, page] = paginateData(countries, count, Number(req.query.page)||1);

  const result = {
    page: page,
    totalPages: totalPages,
    count: count,
    totalCount: totalCountries,
    data,
  };
  res.json(result);
});

/**
 * Individual country
 * @param {urlParam} code: ISO-2 or ISO-3 country code
 */
router.get("/:code", (req, res)=>{
  const code = req.params.code;

  if (!/^[a-zA-Z()]+$/.test(code)) {
    res.status(404).json({
      error: {
        status: "invalid-argument",
        message: "Bad request",
      },
    });
    return;
  }
  const country = getCountry(code);
  // Verify country exists (on DB)
  if (!country) {
    res.status(404).json({
      error: {
        status: "not-found",
        message: "No valid country found for given ISO code",
      },
    });
    return;
  }
  // Send data
  res.json(country);
  return;
});

/**
 * Query countries by name
 * @param {urlParam : string} queryName: Country name to be query
 * @param {queryParam : number} page: current page
 * @param {queryParam  : number} count: number of countries per page
 * @param {queryParam  : boolean} exact: Flag to match the whole string (true) or each word otherwise
 */
router.get("/name/:queryName", (req, res)=>{
  const name = req.params.queryName;
  const strictMode = String(req.query.exact).toLowerCase() === "true";
  const countries = getAllCountries();

  if (!countries) {
    res.status(500).json({
      error: {
        status: "internal",
        message: "An error occurred retrieving countries info",
      },
    });
    return;
  }
  const filteredCountries = countries.filter((c: Country) =>{
    const normalizedQueryName = name.normalize().trim().toLowerCase();
    const normalizedName = String(c.name).normalize().trim().toLowerCase();
    const splittedName = normalizedName.split(" ").map((t)=>t.trim());
    // Check if the whole string name matches
    const fullNameIsValid = normalizedName.startsWith(normalizedQueryName);
    // Check if the each word of string name matches
    const oneOfEachWordsIsValid = splittedName.filter((c) => c.startsWith(normalizedQueryName)).length>0;

    // "One of each word is valid" mode is valid only if NOT strict mode
    return fullNameIsValid || (!strictMode&&oneOfEachWordsIsValid);
  });
  if (filteredCountries.length) {
    const count = getCount(5, Number(req.query.count), filteredCountries.length);
    const [data, totalPages, page] = paginateData(filteredCountries, count, Number(req.query.page||1));
    const result = {
      page: page,
      totalPages: totalPages,
      count: count,
      totalCount: filteredCountries.length,
      data,
    };
    res.json(result);
  } else {
    res.status(400).json({
      error: {
        status: "not-found",
        message: "No country for given name",
      },
    });
  }
  return;
});

export default router;
