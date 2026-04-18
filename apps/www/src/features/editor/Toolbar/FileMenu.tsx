import React from "react";
import { Flex, Menu } from "@mantine/core";
import { event as gaEvent } from "nextjs-google-analytics";
import { CgChevronDown } from "react-icons/cg";
import useFile from "../../../store/useFile";
import { useModal } from "../../../store/useModal";
import { useTranslation } from "../../../store/useI18n";
import { StyledToolElement } from "./styles";

export const FileMenu = () => {
  const setVisible = useModal(state => state.setVisible);
  const getContents = useFile(state => state.getContents);
  const getFormat = useFile(state => state.getFormat);
  const { t } = useTranslation();

  const handleSave = () => {
    const a = document.createElement("a");
    const file = new Blob([getContents()], { type: "text/plain" });

    a.href = window.URL.createObjectURL(file);
    a.download = `jsoncrack.${getFormat()}`;
    a.click();

    gaEvent("save_file", { label: getFormat() });
  };

  return (
    <Menu shadow="md" withArrow>
      <Menu.Target>
        <StyledToolElement title={t("file")}>
          <Flex align="center" gap={3}>
            {t("file")}
            <CgChevronDown />
          </Flex>
        </StyledToolElement>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => setVisible("ImportModal", true)}>
          {t("import")}
        </Menu.Item>
        <Menu.Item onClick={handleSave}>{t("export")}</Menu.Item>
        <Menu.Item onClick={() => setVisible("RedactModal", true)}>
          {t("exportWithRedaction")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
