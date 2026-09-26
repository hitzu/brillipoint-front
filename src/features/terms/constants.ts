import type {
  GetBrandTermsResponse,
  GetBrandsResponse,
  GetPackageTermsResponse,
  GetPackagesResponse,
  TermScope,
} from "../../interfaces";

export interface SelectOption {
  value: number;
  label: string;
}

export const termScopes: Array<{ value: TermScope; label: string }> = [
  { value: "global", label: "Globales" },
  { value: "package", label: "Paquetes" },
  { value: "brand", label: "Marcas" },
];

export const termScopeValues = termScopes.map(
  ({ value }) => value
) as TermScope[];

export const mapBrandsToOptions = (
  brands: GetBrandsResponse[]
): SelectOption[] =>
  brands.map((brand) => ({
    value: brand.id,
    label: brand.name,
  }));

export const mapPackagesToOptions = (
  packages: GetPackagesResponse[]
): SelectOption[] =>
  packages.map((pkg) => ({
    value: pkg.id,
    label: pkg.name,
  }));

export const mapPackageTermsToOptions = (
  packageTerms?: GetPackageTermsResponse[]
): SelectOption[] =>
  packageTerms
    ?.filter((packageTerm) => packageTerm.package)
    .map((packageTerm) => ({
      value: packageTerm.package.id,
      label: packageTerm.package.name,
    })) ?? [];

export const mapBrandTermsToOptions = (
  brandTerms?: GetBrandTermsResponse[]
): SelectOption[] =>
  brandTerms?.map((brandTerm) => ({
    value: brandTerm.brand.id,
    label: brandTerm.brand.name,
  })) ?? [];
