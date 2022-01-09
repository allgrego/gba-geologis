/**
 * Miscellaneous Functions for GBA Geologis Microservice
 *
 * @author: Gregorio Alvarez <galvarez@gbalogistic.com>
 * @description: Miscellaneous functions to be used across multiple files of this microservice
 * @copyright: GBA Logistics
 */

import * as countries from "../data/countries.json";
import * as continents from "../data/continents.json";
import {Country, Continent} from "./interfaces";

/**
 * Get all countries
 * @param {string} code: country ISO code to retrieve
 * @return {Country[] | null}: country if exists, otherwise null
 */
export const getAllCountries = () : Country[] | null => {
  try {
    return countries;
  } catch (error) {
    console.log("[ERROR]: ", error);
    return null;
  }
};

/**
 * Get country for given ISO code (ISO-2 or ISO-3)
 * @param {string} code: country ISO code to retrieve
 * @return {Country | null}: country if exists, otherwise null
 */
export const getCountry = (code : string | undefined ) : Country | null => {
  if (!code || typeof code !== "string") return null;

  const coincidences = countries.filter((t)=>{
    const processedCode = code.trim().toLowerCase();
    return t.code.toLowerCase() === processedCode || t.code_iso3.toLowerCase() === processedCode;
  });
  if (coincidences.length) {
    const country = coincidences[0];
    const flagURL = `https://static.vesselfinder.net/images/flags/4x3/${country.code.toLowerCase()}.svg`;
    return {...country, flagURL};
  } else {
    return null;
  }
};

/**
 * Get continent for given code
 * @param {string} code: continent code to retrieve
 * @return {Continent | null}: country if exists, otherwise null
 */
export const getContinent = (code : string | undefined ) : Continent | null => {
  if (!code || typeof code !== "string") return null;

  const coincidences = continents.filter((t)=>{
    const processedCode = code.trim().toLowerCase();
    return t.code.toLowerCase() === processedCode;
  });
  if (coincidences.length) {
    return coincidences[0];
  } else {
    return null;
  }
};

/**
 * Verify if a string is a valid JSON
 * @param {string} jsonString: String of JSON to be verified
 * @return {bool}: true if is a valid JSON, otherwise false
 */
export const isValidJson = (jsonString : string) : boolean => {
  try {
    JSON.parse(jsonString);
  } catch (e) {
    return false;
  }
  return true;
};

/**
 * Receive string of JSON data from Maersk (from https://api.maersk.com/locations/) with Content Type application/stream+json
 * and return its JSON object
 * @param {string | null | undefined} body:
 * @return {any[] | null }: parsed object of data or null if no valid data
 */
export const parseMaerskStreamJson = (body : string | null | undefined) : any => {
  if (!body) return null;
  // Array of strings (from body string)
  const jsonStrings = String(body).split("}") // Separate by } character
      .map((c) => c+"}") // Add "}" character for each item
      .filter((t) => t.trim().startsWith("{")); // Trim each one and select only those that starts with "{"
  // Parse string items to JSON (empty array by default)
  return jsonStrings.length?
    jsonStrings.map((c) => isValidJson(c) ? JSON.parse(c) : null)
        // Filter to remove null items
        .filter((c) => c) : null;
};

/**
 * Parse Cities according to Maersk API Model (from https://api.maersk.com/locations/)
 * @param {any[]} jsonCities: collection of cities with Maersk Model (Elements MUST be JSON)
 * @return {any[]}: collection of cities with custom data model
 */
export const parseMaerskCities = (jsonCities : any[]) : any[] | null => {
  if (!jsonCities || !Array.isArray(jsonCities)) throw new Error("invalid Data");
  try {
    // Return processed data
    return jsonCities.map((c: any) => {
    // Maersk City Data (initially empty) to separate from general Data
      let maerksCityData = {};
      // Maersk City Data Parameters
      const maerskCityDataParameters = {
        geolocationId: c.maerskGeoLocationId,
        countryGeoId: c.countryGeoId,
        brands: c.brands,
        brandNames: c.brandNames,
        stCode: c.maerskRkstCode,
        tsCode: c.maerskRktsCode,
      };

      // Filter Maersk data
      Object.entries(maerskCityDataParameters).forEach((d) => {
        if (d[1]) maerksCityData = {...maerksCityData, [d[0]]: d[1]};
      });

      // Country info from DB (Data given from Maersk if not in DB)
      const countryInfo = getCountry(c.countryCode) || {code: c.countryCode, name: c.countryName, continent: null};
      // Destructure continent from country
      const {continent, ...restCountryInfo} = countryInfo;
      // City Parameters
      const cityParameters = {
        id: maerskCityDataParameters.stCode,
        name: c.cityName,
        country: restCountryInfo,
        continent: continent,
        region: (c.regionCode)?{
          code: c.regionCode,
          name: c.regionName,
        } : null,
        timezoneId: c.timezoneId,
        maerskData: maerksCityData,
      };
      // City data (initially empty object)
      let city = {};
      // Add only valid data to city
      Object.entries(cityParameters).forEach((p) => {
        if (p[1]) city = {...city, [p[0]]: p[1]};
      });

      return city;
    });
  } catch (error) {
    console.log(error);
    return null;
  }
};

/**
 * Paginate array of data and provide processed current page and total pages
 * @param {any[]} data: data to be paginated
 * @param {number} count: amount of elements per page
 * @param {number} page: current page (unprocessed)
 * @return {any[]}: array of paginated data, total amount of pages, and current page
 */
export const paginateData = (data : any[] | null |undefined, count : number, page : number ) => {
  if (!data||!Array.isArray(data)) throw new Error("Invalid data to paginate");
  // Page
  const DEFAULT_PAGE = 1;
  let totalPages = Math.round(data.length/count);
  totalPages = totalPages < 1 ? 1 : totalPages;
  let currentPage = Math.floor(+(page?.toString() || DEFAULT_PAGE));
  if (!currentPage||currentPage<1) currentPage = DEFAULT_PAGE;
  else if ( currentPage>totalPages ) currentPage = totalPages;

  // Paginate
  const startIndex = (currentPage-1)*count;
  const endIndex = currentPage*count;
  return [
    data.slice(startIndex, endIndex),
    totalPages,
    currentPage,
  ];
};

export const getCount = (defaultCount :number, countValue : string | number | null | undefined, dataLenght : number)
: number => {
  if (!defaultCount || !dataLenght) throw new Error("All arguments all required");
  const providedCount = Number(countValue||defaultCount);
  let count : number = Math.floor(Number(providedCount|| defaultCount));
  if (!count||count<1) count = defaultCount;
  if (count>dataLenght) count = dataLenght;
  return count;
};
