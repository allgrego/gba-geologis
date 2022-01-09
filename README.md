# GBA Geologis

A GBA Logistics microservice to handle Geographical data (countries, continents, cities, etc)

**Author**: _Gregorio Alvarez < galvarez@gbalogistic.com >_
**Version**: 1.1.0

Based on [GBA Firebase Microservice Boilerplate](https://github.com/allgrego/gba-firebase-microservice-boilerplate).
**MUST be used with [GBA Firebase Functions Microservices Architecture Boilerplate](https://github.com/allgrego/gba-firebase-functions-microservices-boilerplate)**.

## Initial Setup

**Base URI**: `https://gbageologis.web.app/v1/`
**Bearer Token is required**. All endpoints must content the Authorization header:

```
Authorization: Bearer {token}

```

## Endpoints

- GET /countries
- GET /countries/**{ISOcode}**
- GET /countries/name/**{queryName}**
- GET /continents
- GET /continents/**{code}**
- GET /continents/**{code}**/countries
- GET /cities/name/**{queryName}**
- GET /cities/country/**{countryISOCode}**/name/**{cityQueryName}**

### GET /countries

Obtain a paginated collection of all countries

#### Query Parameters

| Name  | Data Type | Required / Optional | Default Value | Description                               |
| ----- | --------- | ------------------- | ------------- | ----------------------------------------- |
| page  | integer   | optional            | 1             | Current page for paginated data           |
| count | integer   | optional            | 5             | Number of elements per chunk of countries |

Sample request with parameters:

```
https://gbageologis.web.app/v1/countries?page=1&count=2

```

Response:

```
{
    page: 1,
    totalPages: 120,
    count: 2,
    totalCount: 240,
    data: [
        {
            code: "AD",
            code_iso3: "AND",
            name: "Andorra",
            phone_code: "376",
            continent: "EU"
        },
        {
            code: "AE",
            code_iso3: "ARE",
            name: "United Arab Emirates",
            phone_code: "971",
            continent: "AS"
        }
    ]
}

```

### GET /countries/{code}

Obtain data of a single country for a given ISO-3116 code.

### Path Parameters

| Name | Data Type | Required / Optional | Description                                                    |
| ---- | --------- | ------------------- | -------------------------------------------------------------- |
| code | string    | required            | ISO-3116 country code. It can either be ISO Alpha-2 or Alpha-3 |

Sample request with parameters:

```
https://gbageologis.web.app/v1/countries/ve

```

Response:

```
{
  code: "VE",
  code_iso3: "VEN",
  name: "Venezuela",
  phone_code: "58",
  continent: "SA",
  flagURL: "https://static.vesselfinder.net/images/flags/4x3/ve.svg"
}

```

### GET /countries/name/{queryName}

Search a country based on a query that matches the country name. Obtaining a paginated collection

### Path Parameters

| Name      | Data Type | Required / Optional | Description                         |
| --------- | --------- | ------------------- | ----------------------------------- |
| queryName | string    | required            | Name of country(ies) to be searched |

#### Query Parameters

| Name  | Data Type | Required / Optional | Default Value | Description                                                                                            |
| ----- | --------- | ------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| page  | integer   | optional            | 1             | Current page for paginated data                                                                        |
| count | integer   | optional            | 5             | Number of elements per chunk of countries                                                              |
| exact | boolean   | optional            | false         | if true matches the whole name from the first character, otherwise it can match from each word in name |

Sample request with parameters:

```
https://gbageologis.web.app/v1/countries/name/pa?page=1&count=3&exact=true

```

Response:

```
{
  page: 1,
  totalPages: 2,
  count: 3,
  totalCount: 6,
  data: [
    {
      code: "PK",
      code_iso3: "PAK",
      name: "Pakistan",
      phone_code: "92",
      continent: "AS"
    },
    {
      code: "PW",
      code_iso3: "PLW",
      name: "Palau",
      phone_code: "680",
      continent: "OC"
    },
    {
      code: "PS",
      code_iso3: "PSE",
      name: "Palestine",
      phone_code: "970",
      continent: "AS"
    }
  ]
}

```

### GET /continents

Sample request with parameters:

```
https://gbageologis.web.app/v1/continents?page=1&count=3

```

### GET /continents/{code}

Sample request with parameters:

```
https://gbageologis.web.app/v1/continents/sa

```

### GET /continents/{code}/countries
Sample request with parameters:

```
https://gbageologis.web.app/v1/continents/sa/countries?page=1&count=3

```

### GET /cities/name/{searchQuery}

Sample request with parameters:

```
https://gbageologis.web.app/v1/cities/name/la%20guaira?page=1&count=3

```

### GET /cities/country/{countryCode}/name/{searchQuery}

Sample request with parameters:

```
https://gbageologis.web.app/v1/cities/country/fr/name/paris?page=1&count=3

```