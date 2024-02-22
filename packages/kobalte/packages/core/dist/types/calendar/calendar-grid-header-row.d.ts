/*!
 * Portions of this file are based on code from react-spectrum.
 * Apache License Version 2.0, Copyright 2020 Adobe.
 *
 * Credits to the React Spectrum team:
 * https://github.com/adobe/react-spectrum/blob/0a1d0cd4e1b2f77eed7c0ea08fce8a04f8de6921/packages/@react-aria/calendar/src/useCalendarGrid.ts
 * https://github.com/adobe/react-spectrum/blob/0a1d0cd4e1b2f77eed7c0ea08fce8a04f8de6921/packages/react-aria-components/src/Calendar.tsx
 */
import { OverrideComponentProps } from "@kobalte/utils";
import { Accessor, JSX } from "solid-js";
export interface CalendarGridHeaderRowOptions {
    /**
     * Render prop used to render each cell of the header row,
     * it receives a week day accessor as parameter.
     */
    children: (weekDay: Accessor<string>) => JSX.Element;
}
export type CalendarGridHeaderRowProps = OverrideComponentProps<"tr", CalendarGridHeaderRowOptions>;
/**
 * A calendar grid header row displays week day names inside a `Calendar.GridHeader`.
 */
export declare function CalendarGridHeaderRow(props: CalendarGridHeaderRowProps): JSX.Element;
