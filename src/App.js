import "./styles.css";
import React from "react";
import styled, { css } from "styled-components";

const AccordionApiContext = React.createContext();

const useAccordionApi = () => {
  const ctx = React.useContext(AccordionApiContext);

  return ctx;
};

const Accordion = ({ oneAtATime, children, gap = "0" }) => {
  const subscribers = React.useRef({});

  const api = {
    oneAtATime,
    subscribe: (event, callback) => {
      let index;

      if (!subscribers.current[event]) {
        subscribers.current[event] = [];
      }

      index = subscribers.current[event].push(callback) - 1;

      return {
        unsubscribe: () => {
          subscribers.current = {
            ...subscribers.current,
            [event]: subscribers.current[event].splice(index, 1)
          };
        }
      };
    },
    publish: (event, data) => {
      if (!subscribers.current[event]) return;

      subscribers.current[event].forEach((subscriberCallback) =>
        subscriberCallback(data)
      );
    }
  };

  return (
    <AccordionApiContext.Provider value={api}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap
        }}
      >
        {children}
      </div>
    </AccordionApiContext.Provider>
  );
};

const PanelContext = React.createContext();

const PanelContextProvider = ({ children }) => {
  const refs = React.useRef({});

  const api = React.useMemo(
    () => ({
      refs,
      setRefData: (key, data) => {
        refs.current = {
          ...refs.current,
          [key]: data
        };
      }
    }),
    []
  );
  return <PanelContext.Provider value={api}>{children}</PanelContext.Provider>;
};

const usePanelState = () => {
  const ctx = React.useContext(PanelContext);

  return ctx;
};

const StyledSummary = styled.summary`
  padding: 8px;
  text-align: left;
  border: 1px solid dodgerblue;
  border-radius: 8px;
  list-style: none;
  ::-webkit-details-marker {
    display: none;
  }
`;

const StyledDetails = styled.details`
  --spacer: 8px;
  --arrow-width: 16px;

  display: flex;

  &[open] > ${StyledSummary}::${({ iconRight }) =>
  iconRight ? "after" : "before"} {
    transform: rotate(180deg);
  }

  ${({ iconRight }) =>
    iconRight
      ? css`
          > ${StyledSummary}::after {
            position: absolute;
            right: calc(var(--arrow-width) / 2 + var(--spacer));
            vertical-align: middle;
            transition: 0.2s;
            display: inline-block;
            content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='dodgerblue' class='bi bi-caret-up-fill' viewBox='0 0 16 16'%3E%3Cpath d='m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z'/%3E%3C/svg%3E");
          }
        `
      : css`
          > ${StyledSummary}::before {
            vertical-align: middle;
            transition: 0.2s;
            display: inline-block;
            margin-right: var(--spacer);
            content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='dodgerblue' class='bi bi-caret-up-fill' viewBox='0 0 16 16'%3E%3Cpath d='m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z'/%3E%3C/svg%3E");
          }
        `}
`;

const Panel = ({ iconRight, initIsOpen, children }) => {
  return (
    <PanelContextProvider>
      <InnerPanel iconRight={iconRight} initIsOpen={initIsOpen}>
        {children}
      </InnerPanel>
    </PanelContextProvider>
  );
};

const InnerPanel = ({ iconRight, initIsOpen, children }) => {
  const id = React.useId();
  const ref = React.useRef(null);
  const { subscribe, publish, oneAtATime } = useAccordionApi();
  const { setRefData } = usePanelState();

  React.useEffect(() => {
    const sub = subscribe("open", (data) => {
      if (oneAtATime && ref.current.open && data.id !== id) {
        ref.current.removeAttribute("open");
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, [subscribe, oneAtATime, id]);

  React.useEffect(() => {
    if (initIsOpen) {
      ref.current.setAttribute("open", true);
    }
  }, [initIsOpen]);

  return (
    <StyledDetails
      iconRight={iconRight}
      onToggle={(e) => {
        publish(e.currentTarget.open ? "open" : "close", { id });
      }}
      id={id}
      ref={(el) => {
        ref.current = el;
        setRefData("details", { id, el });
      }}
    >
      {children}
    </StyledDetails>
  );
};

const Summary = ({ children }) => {
  const id = React.useId();
  const { setRefData } = usePanelState();

  const ref = React.useRef(null);

  return (
    <StyledSummary
      id={id}
      ref={(el) => {
        ref.current = el;
        setRefData("summary", { id, el });
      }}
    >
      {children}
    </StyledSummary>
  );
};

const Flex = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: ${({ iconRight }) =>
    iconRight
      ? "var(--spacer)"
      : `var(--spacer) calc(var(--spacer) * 2 + var(--arrow-width))`};
`;

export default function App() {
  return (
    <div className="App">
      <Accordion oneAtATime gap="8px">
        <Panel iconRight>
          <Summary>hi</Summary>
          <Flex iconRight>hello</Flex>
        </Panel>
        <Panel>
          <Summary>hi</Summary>
          <Flex>hello</Flex>
        </Panel>
        <Panel initIsOpen>
          <Summary>hi</Summary>
          <Flex>hello</Flex>
        </Panel>
      </Accordion>
    </div>
  );
}
