"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useColorModeValue,
} from "@chakra-ui/react";

const SUPPORTED_LOCALES = [
  { code: "vi", labelKey: "vietnamese", shortLabel: "VI" },
  { code: "en", labelKey: "english", shortLabel: "EN" },
] as const;

function removeLocalePrefix(pathname: string, locale: string) {
  const prefix = new RegExp(`^/${locale}(?=/|$)`);
  return pathname.replace(prefix, "") || "/";
}

export const LanguageSwitcher = ({ isHeader = false }: { isHeader?: boolean }) => {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const currentLocale = SUPPORTED_LOCALES.find((item) => item.code === locale) ?? SUPPORTED_LOCALES[0];
  const textColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const borderColor = useColorModeValue("blackAlpha.200", "whiteAlpha.400");
  const hoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.200");

  const selectLocale = (nextLocale: string) => {
    if (nextLocale === locale) return;
    const pathWithoutLocale = removeLocalePrefix(pathname, locale);
    const nextPath = nextLocale === "vi" && pathWithoutLocale === "/"
      ? "/"
      : `/${nextLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
    router.replace(nextPath);
  };

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        size="sm"
        variant="outline"
        borderColor={borderColor}
        color={textColor}
        fontSize="xs"
        fontWeight="700"
        minW={isHeader ? "58px" : "52px"}
        px={3}
        aria-label={t("selectLanguage")}
        _hover={{ bg: hoverBg, borderColor: "brand.400" }}
      >
        {currentLocale.shortLabel}
      </MenuButton>
      <MenuList zIndex={2000} minW="160px">
        {SUPPORTED_LOCALES.map((item) => (
          <MenuItem
            key={item.code}
            onClick={() => selectLocale(item.code)}
            icon={item.code === locale ? <span aria-hidden="true">✓</span> : undefined}
            fontWeight={item.code === locale ? "700" : "400"}
          >
            {t(item.labelKey)}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};
