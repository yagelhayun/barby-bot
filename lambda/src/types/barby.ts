export type Show = {
    showId: string;
    showName: string;
    showDate: string;
    showTime: string;
    showPrice: number;
    showSold: number;
    showSoldMaxBuy: number;
};

export type BarbyApiResponse = {
    returnShow?: {
        show?: Show[];
    };
};
