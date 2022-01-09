import {Router} from "express";
import * as continents from "./data/continents.json";
import * as countries from "./data/countries.json";
import {getContinent, getCount, paginateData} from "./lib/misc";

const router = Router();

const DEFAULT_SORT_ORDER = "asc";
const ALT_SORT_ORDER = "desc";
const DEFAULT_COUNT = 5;

// Middleware that is specific for these routes
router.use((req, res, next)=>{
  // Cache data for 1 hour
  res.set("Cache-Control", "public, max-age=1800, s-maxage=3600");
  next();
});

/**
 * All continents
 * @param {queryParam} order: default "asc", alphabetically order (alt option: "desc")
 */
router.get("/", (req, res)=>{
  // Sort query params
  let order : string = req.query.order?.toString()|| DEFAULT_SORT_ORDER;
  if (!order||order!==ALT_SORT_ORDER) order = DEFAULT_SORT_ORDER;

  // Sorted continents
  const allContinents = continents.sort( compare("code", order));
  // Number of continents
  const totalContinents = allContinents.length;
  const DEFAULT_CONTINENTS_COUNT = 7;
  console.log(String(req.query.count));

  const count = getCount(DEFAULT_CONTINENTS_COUNT, String(req.query.count), totalContinents);
  // Page from query param (1 by default)
  const page = Number(req.query.page) || 1;

  const [data, totalPages, currentPage] = paginateData(allContinents, count, page);

  const result = {
    page: currentPage,
    totalPages,
    count,
    totalCount: totalContinents,
    data,
  };

  res.json(result);
});

/**
 * Individual continent
 * @param {urlParam} code: continent code
 */
router.get("/:code", (req, res)=>{
  const code = req.params.code;

  const continent = getContinent(code);

  // Verify country exists (on DB)
  if (!continent) {
    res.status(404).json({
      error: {
        status: "not-found",
        message: "No continent found for given code",
      },
    });
    return;
  }
  // Send data
  res.json(continent);
  return;
});

/**
 * Get countries for an specific continent
 */
router.get("/:continentCode/countries", (req, res)=>{
  const code = req.params.continentCode;
  let selectedContinent = null;

  if (code) {
    for (let i = 0; i< continents.length; i++) {
      const continent = continents[i];
      // Continent code
      const searchCode = String(code).toLocaleLowerCase();
      if (continent.code.toLocaleLowerCase() === searchCode) {
        // Set selected continent
        selectedContinent = {
          code: continent.code,
          name: continent.name,
        };
        break;
      }
    }
  }

  // If no continent matches given code
  if (!selectedContinent) {
    res.status(400).json({
      error: {
        status: "invalid-parameters",
        message: "Invalid continent code",
      },
    });
    return;
  }

  interface CustomCountry {
    code: string,
    code_iso3: string,
    name: string,
    phone_code: string | null,
  }
  // Correspondent countries array
  let continentCountries : CustomCountry[] = [];
  // Iterate on all countries
  for (let i = 0; i< countries.length; i++) {
    const country = countries[i];
    // Add country if it is from given continent
    if (country.continent && country.continent?.toLocaleLowerCase() === code.toLocaleLowerCase()) {
      // Destructure country to remove continent
      const {continent, ...restOfCountry} = country;
      continentCountries.push(restOfCountry);
    }
  }

  // Sort query params
  let order : string | undefined = req.query.order?.toString()|| DEFAULT_SORT_ORDER;
  if (!order||order!==ALT_SORT_ORDER) order = DEFAULT_SORT_ORDER;

  // Sort countries
  continentCountries = continentCountries.sort( compare("code", order));
  const AmountOfContinentCountries = continentCountries.length;

  // Number of countries per chunk
  let count : number = Math.floor(+(req.query.count|| DEFAULT_COUNT));
  if (!count||count>continentCountries.length||count<1) count = DEFAULT_COUNT;

  // Page
  const DEFAULT_PAGE = 1;
  let totalPages = Math.round(continentCountries.length/count);
  totalPages = totalPages < 1 ? 1 : totalPages;
  let page = Math.floor(+(req.query.page?.toString() || DEFAULT_PAGE));
  if (!page||page<1) page = DEFAULT_PAGE;
  else if ( page>totalPages ) page = totalPages;

  // Paginate selected countries
  const startIndex = (page-1)*count;
  const endIndex = page*count;
  continentCountries = continentCountries.slice(startIndex, endIndex);

  const result = {
    page: page,
    totalPages: totalPages,
    count: count,
    totalCountries: AmountOfContinentCountries,
    data: continentCountries,
  };
  // Send json data
  res.json(result);
  return;
});

export default router;

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
