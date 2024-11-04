export interface User {
    fname? : string ;
    lname? : string;
    phone? : string;
    email? : string;
    picture? : string;
    password?: string;
    repassword?: string;
    House_number?: string;
    IDcard? : string;
    User_ID? : number;

}

export interface Userinfo {
    User_ID: number
    User_Firstname: string
    User_Lastname: string
    IDcard: string
    username: string
    email: string
    password: string
    phone: string
    role: string
    User_image: any
  }
  
