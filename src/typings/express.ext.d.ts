type Gender = {
    Male: 'male'
    Female: 'female'
    Other: 'other'
}

declare namespace Express {
    interface Response {
        arrivedTime: number,
        local: {
            uid: number,
            chaosId: string,
            user: {
                id: number,
                createdAt: string,
                name: string,
                avatar: string,
                phone: string,
                gender?: Gender,
            }
        }
    }
}
