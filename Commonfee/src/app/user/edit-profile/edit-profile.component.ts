import { Component } from '@angular/core';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent {
  user = {
    firstname: 'Jane',
    lastname: 'Doe',
    phone: '0123456789',
    username: 'janedoe',
    email: 'janedoe@example.com',
    password: 'password1234'
  };

  saveProfile(): void {
    alert('Profile saved successfully!\n' +
      `First Name: ${this.user.firstname}\n` +
      `Last Name: ${this.user.lastname}\n` +
      `Phone: ${this.user.phone}\n` +
      `Username: ${this.user.username}\n` +
      `Email: ${this.user.email}`);
  }

  resetForm(): void {
    this.user = {
      firstname: 'Jane',
      lastname: 'Doe',
      phone: '0123456789',
      username: 'johndoe',
      email: 'janedoe@example.com',
      password: 'password1234'
    };
    alert('Form reset to default values!');
  }
}