export interface Libro {
    id: number,
    titulo: string,
    autor: string
}

export let libros: Libro[] = [
    {id:1, titulo:"Cien años de soledad", autor:"Gabriel Garcia Marquez"},
    {id:2, titulo: "El principito", autor:"Antoine de Saint-Exupery"},
    {id:3, titulo: "1984", autor:"George Orwell"}
]

export const ids = {
    siguiente: libros.length + 1
}