export interface Show {
    showId: string;
    showName: string;
    showDate: string;
    showTime: string;
    showPrice: number;
    showSold: number;
    showSoldMaxBuy: number;
}

export interface BarbyApiResponse {
    returnShow?: {
        show?: Show[];
    };
}
