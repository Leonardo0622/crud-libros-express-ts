export interface  ApiError{
    error: string,
    detalles?: String[]
}


export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly message: string,
        public readonly detalles?: string[]
    ){
        super(message);
        this.name = "Api Error"
    }

    toResponde():ApiError {
        return {error: this.message, detalles: this.detalles}
    }
}

export const notFound = ( recurso:string) => 
    new AppError(404,`${recurso} no encontrado` );

export const badRequest = (mensaje: string, detalles?: string[]) =>
    new AppError(400, mensaje, detalles)

