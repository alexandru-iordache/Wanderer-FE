export interface Route {
    id: string,
    startLocationId: string,
    endLocationId: string,
    startDate: Date,
    endDate: Date,
    distance: number,
    tripId: string,
    routeType: RouteType
}
