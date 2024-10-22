export interface Users{
    User_ID : number,
    firstname : string,
    lastname : string,
    username : string,
    email : string,
    phone :string, 
    role : string,
  }

export interface Announcement{
  Announce_ID : number,
  Announce_Date : string,
  Announce_Title : string,
  Announce_Detail : string,
  Announce_image : string,
}

export interface Resident {
  IDcard: string
  R_Firstname: string
  R_Lastname: string
  phone: string
  House_number: string
  EntryDate: string
  status: string
  email: string
  House_No : number
}

export interface House {
  House_No : number
  House_number : string
  House_Size : string
  House_status : string
}

export interface ResidentStatus {
  R_ID: number
  R_Lastname: string
  R_Firstname: string
  status: string
  phone: string
  Pay_Status: string
  House_number: string
  House_No: number
}

export interface paymentHistory{
  Pay_ID : number
  Pay_Date : string
  User_ID : number
  R_Firstname : string
  R_Lastname : string
  House_number : string
  House_Size : string
  Pay_Amount : number
  Pay_Deadline : string
  Pay_Status : string
  Land_size : number
}
export interface PetitionHistory{
  User_ID : number
  R_ID : number
  petition_ID : number
  petition_Title : string
  petition_status : string
  petition_detail : string
  petition_Date : string
  petition_Type : string
  House_number : string
}

export interface PetitionAdmin {
  petition_Date: string
  R_Firstname: string
  R_Lastname: string
  phone : string
  House_number: string
  petition_Title: string
  petition_detail: string
  petition_Type: string
  petition_status: string
  petition_ID: number
}

export interface PeymentForAdmin {
  R_Firstname: string
  R_Lastname: string
  House_number: string
  phone: string
  Pay_Amount: number
  Pay_Deadline: string
  Pay_Status: string
  Pay_Out : number
}


