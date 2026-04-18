import { Menu } from "@mantine/core";
import { CgChevronDown } from "react-icons/cg";
import { FiGlobe } from "react-icons/fi";
import { useTranslation } from "../../../store/useI18n";
import type { Language } from "../../../lib/i18n";
import { StyledToolElement } from "./styles";

const languageLabels: Record<Language, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
};

export const LanguageToggle = () => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <Menu shadow="md" withArrow>
      <Menu.Target>
        <StyledToolElement title={t("language")}>
          <FiGlobe size="18" />
        </StyledToolElement>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("language")}</Menu.Label>
        <Menu.Item
          rightSection={language === "en" ? "✓" : undefined}
          onClick={() => setLanguage("en")}
        >
          {languageLabels.en}
        </Menu.Item>
        <Menu.Item
          rightSection={language === "zh" ? "✓" : undefined}
          onClick={() => setLanguage("zh")}
        >
          {languageLabels.zh}
        </Menu.Item>
        <Menu.Item
          rightSection={language === "ja" ? "✓" : undefined}
          onClick={() => setLanguage("ja")}
        >
          {languageLabels.ja}
        </Menu.Item>
        <Menu.Item
          rightSection={language === "ko" ? "✓" : undefined}
          onClick={() => setLanguage("ko")}
        >
          {languageLabels.ko}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
