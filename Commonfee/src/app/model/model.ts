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
  Announce_Status : string,
  Adjusted_Announce_Date : string
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
  User_image : string
  username : string
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
  overdueCount: number; 
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
  Pay_Fine : number 
  Receipt_ID: number
  Receipt_Date: string
  Receipt_Total: number
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

export interface MonthlyPaymentData {
  Pay_Month: string
  Paid_Count: number
  Overdue_Count: number
}
export interface MonthlyPetitionData {
  petition_Date: string
  Repair_Count: number
  Normal_Count: number
}

export interface FeeRate{
  House_Size : string
  Land_size : number
  FeeRate : number
  Fine : number
}

export interface Receipt {
  Receipt_ID: number
  Receipt_Date: string
  R_Firstname: string
  R_Lastname: string
  House_number: string
  Paid_Amount: number
  Paid_Fine: number
  Receipt_Total: number
  Pay_ID : number
  User_ID : number
}

export interface Income {
  Month : string
  TotalAmount : number
}

export interface Lastpaid {
  R_ID: number
  R_Firstname: string
  R_Lastname: string
  Pay_ID: number
  Paid_ID: number
  Paid_Date: string
  Paid_Amount: number
  Paid_Fine: number
  Adjusted_Paid_Date : number
}
