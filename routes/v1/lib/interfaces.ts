/**
 * TypeScript interfaces
 *
 * @author: Gregorio Alvarez <galvarez@gbalogistic.com>
 * @description: Miscellaneous functions to be used across multiple files of this microservice
 * @copyright: GBA Logistics
 */

export interface Country {
  code: string | undefined,
  code_iso3: string | undefined,
  name: string | string [] | undefined,
  phone_code: string | null | undefined,
  continent: string | null | undefined,
  flagURL?: string | null |undefined,
}

export interface Continent {
  code : string | undefined,
  name : string | undefined,
  altLangName?: {
    [key : string]: string
  }
}
