import { faker } from "@faker-js/faker";
import type { SortingState } from "@tanstack/react-table";


const organizations = ["Northwestern", "Michigan", "MIT", "Stanford"] as const
type Organization = typeof organizations[number]

const groups = ["Soccer", "Basketball", "Football", "Baseball"] as const
type Group = typeof groups[number]

export type Person = {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    visits: number;
    progress: number;
    createdAt: Date;
    organization: Organization;
    group: Group;
};

export type PersonApiResponse = {
    data: Person[];
    meta: {
        totalRowCount: number;
    };
};

const range = (len: number) => {
    const arr = [];
    for (let i = 0; i < len; i++) {
        arr.push(i);
    }
    return arr;
};

const newPerson = (index: number): Person => {
    return {
        id: index + 1,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        age: faker.number.int(40),
        visits: faker.number.int(1000),
        progress: faker.number.int(100),
        createdAt: faker.date.past(),
        organization: faker.helpers.arrayElement(organizations),
        group: faker.helpers.arrayElement(groups),
    };
};

export function makeData(...lens: number[]) {
    const makeDataLevel = (depth = 0): Person[] => {
        const len = lens[depth]!;
        return range(len).map((d): Person => {
            return {
                ...newPerson(d),
            };
        });
    };

    return makeDataLevel();
}

const data = makeData(1000);

const PAGE_SIZE = 20;
//simulates a backend api
export const fetchData = (page: number, sorting: SortingState) => {
    const start = page * PAGE_SIZE;
    const size = PAGE_SIZE;
    const dbData = [...data];
    if (sorting.length) {
        const sort = sorting[0]!;
        const { id, desc } = sort as { id: keyof Person; desc: boolean };
        dbData.sort((a, b) => {
            if (desc) {
                return a[id] < b[id] ? 1 : -1;
            }
            return a[id] > b[id] ? 1 : -1;
        });
    }

    return {
        data: dbData.slice(start, start + size),
        meta: {
            totalRowCount: dbData.length,
            page,
            time: new Date()
        },
    };
};
