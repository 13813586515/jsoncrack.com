import React from "react";
import { Menu, Flex } from "@mantine/core";
import { event as gaEvent } from "nextjs-google-analytics";
import { CgChevronDown } from "react-icons/cg";
import { MdFilterListAlt } from "react-icons/md";
import { VscSearchFuzzy, VscJson, VscGroupByRefType } from "react-icons/vsc";
import { useModal } from "../../../store/useModal";
import { useTranslation } from "../../../store/useI18n";
import { StyledToolElement } from "./styles";

export const ToolsMenu = () => {
  const setVisible = useModal(state => state.setVisible);
  const { t } = useTranslation();

  return (
    <Menu shadow="md" withArrow>
      <Menu.Target>
        <StyledToolElement onClick={() => gaEvent("show_tools_menu")}>
          <Flex align="center" gap={3}>
            {t("tools")} <CgChevronDown />
          </Flex>
        </StyledToolElement>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<VscSearchFuzzy />}
          onClick={() => {
            setVisible("JQModal", true);
            gaEvent("open_jq_modal");
          }}
        >
          {t("jsonQuery")}
        </Menu.Item>
        <Menu.Item
          leftSection={<MdFilterListAlt />}
          onClick={() => {
            setVisible("JPathModal", true);
            gaEvent("open_json_path_modal");
          }}
        >
          {t("jsonPathTool")}
        </Menu.Item>
        <Menu.Item
          leftSection={<VscJson />}
          onClick={() => {
            setVisible("SchemaModal", true);
            gaEvent("open_schema_modal");
          }}
        >
          {t("jsonSchema")}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          leftSection={<VscGroupByRefType />}
          onClick={() => {
            setVisible("TypeModal", true);
            gaEvent("open_type_modal");
          }}
        >
          {t("generateType")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
