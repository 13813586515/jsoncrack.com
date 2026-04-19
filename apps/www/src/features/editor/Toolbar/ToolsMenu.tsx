import React from "react";
import { Menu, Flex, Badge } from "@mantine/core";
import { event as gaEvent } from "nextjs-google-analytics";
import { CgChevronDown } from "react-icons/cg";
import { MdFilterListAlt } from "react-icons/md";
import {
  VscSearchFuzzy,
  VscJson,
  VscGroupByRefType,
  VscDebugAlt,
  VscSymbolSnippet,
  VscFilter,
} from "react-icons/vsc";
import { useModal } from "../../../store/useModal";
import { StyledToolElement } from "./styles";
import usePredicateSearch from "../../editor/views/GraphView/stores/usePredicateSearch";
import useTimeline from "../../editor/views/GraphView/stores/useTimeline";
import useSchemaModeler from "../../editor/views/GraphView/stores/useSchemaModeler";

export const ToolsMenu = () => {
  const setVisible = useModal(state => state.setVisible);
  const { openSearch: openPredicateSearch } = usePredicateSearch();
  const { toggleOpen: toggleTimeline } = useTimeline();
  const { openModeler: openSchemaModeler } = useSchemaModeler();

  return (
    <Menu shadow="md" withArrow>
      <Menu.Target>
        <StyledToolElement onClick={() => gaEvent("show_tools_menu")}>
          <Flex align="center" gap={3}>
            Tools <CgChevronDown />
          </Flex>
        </StyledToolElement>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<VscSymbolSnippet />}
          rightSection={<Badge size="xs" color="blue">New</Badge>}
          onClick={() => {
            openSchemaModeler();
            gaEvent("open_schema_modeler");
          }}
        >
          Schema Modeler
        </Menu.Item>

        <Menu.Item
          leftSection={<VscFilter />}
          rightSection={<Badge size="xs" color="blue">New</Badge>}
          onClick={() => {
            openPredicateSearch();
            gaEvent("open_predicate_search");
          }}
        >
          Predicate Search
        </Menu.Item>

        <Menu.Item
          leftSection={<VscDebugAlt />}
          rightSection={<Badge size="xs" color="blue">New</Badge>}
          onClick={() => {
            toggleTimeline();
            gaEvent("open_timeline");
          }}
        >
          Debug Timeline
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          leftSection={<VscSearchFuzzy />}
          onClick={() => {
            setVisible("JQModal", true);
            gaEvent("open_jq_modal");
          }}
        >
          JSON Query (jq)
        </Menu.Item>
        <Menu.Item
          leftSection={<MdFilterListAlt />}
          onClick={() => {
            setVisible("JPathModal", true);
            gaEvent("open_json_path_modal");
          }}
        >
          JSON Path
        </Menu.Item>
        <Menu.Item
          leftSection={<VscJson />}
          onClick={() => {
            setVisible("SchemaModal", true);
            gaEvent("open_schema_modal");
          }}
        >
          JSON Schema
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          leftSection={<VscGroupByRefType />}
          onClick={() => {
            setVisible("TypeModal", true);
            gaEvent("open_type_modal");
          }}
        >
          Generate Type
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
