export class UiHelper {
    static getShortMonthDate(date: Date): string {
        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short"
          });
    }

    static getLongMonthDate(date: Date): string {
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
          });
    }

    static getSummedDate(startDate: Date, days: number): Date {
        const result = new Date(startDate);
        result.setDate(result.getDate() + days);
    
        return result;
    }
}