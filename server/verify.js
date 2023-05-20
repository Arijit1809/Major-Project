const mongoose = require('mongoose')
const { Schema } = mongoose

const personalConn = mongoose.createConnection("mongodb+srv://shubham242:d5kh2a44s9@cluster0.wkigzuj.mongodb.net/Personal");
const experienceConn = mongoose.createConnection("mongodb+srv://shubham242:d5kh2a44s9@cluster0.wkigzuj.mongodb.net/Experience");
const educationConn = mongoose.createConnection("mongodb+srv://shubham242:d5kh2a44s9@cluster0.wkigzuj.mongodb.net/Education");

const PANSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		pan_number: {
			type: String,
			required: true,
			unique: true,
		},
		father_name: {
			type: String,
			required: true,
		},
		dob: {
			type: Date,
			required: true,
		},
	},
	{ collection: "PAN" }
);

const AadharSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		aadhar_number: {
			type: String,
			required: true,
			unique: true,
		},
		gender: {
			type: String,
			required: true,
		},
		dob: {
			type: Date,
			required: true,
		},
		address: {
			type: String,
			required: true,
		},
	},
	{ collection: "Aadhar" }
);

const VoterIdSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		passport_number: {
			type: String,
			required: true,
			unique: true,
		},
		father_name: {
			type: String,
			required: true,
		},
		elector_name: {
			type: String,
			required: true,
		},
		dob: {
			type: Date,
			required: true,
		},
	},
	{ collection: "VoterId" }
);

const PassportSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		passport_number: {
			type: String,
			required: true,
			unique: true,
		},
		father_name: {
			type: String,
			required: true,
		},
		dob: {
			type: Date,
			required: true,
		},
		birth_place: {
			type: String,
			required: true,
		},
		permanent_address: {
			type: String,
			required: true,
		},
		present_address: {
			type: String,
			required: true,
		},
		issue_place: {
			type: String,
			required: true,
		},
		issue_date: {
			type: Date,
			required: true,
		},
		expiry_date: {
			type: Date,
			required: true,
		},
	},
	{ collection: "Passport" }
);

const EducationCertificateSchema = new Schema(
	{
		type: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		roll_number: {
			type: String,
			required: true,
		},
		father_name: {
			type: String,
			required: true,
		},
		institution_name: {
			type: String,
			required: true,
		},
		admission_year: {
			type: Date,
			required: true,
		},
		passing_year: {
			type: Date,
			required: true,
		},
		percentage: {
			type: Number,
			required: true,
		},
		grade: {
			type: String,
			required: true,
		},
		cgpa: {
			type: Number,
			required: true,
		},
		marks_list: [
			{
				subject: {
					type: String,
					required: true,
				},
				marks: {
					type: Number,
					required: true,
				},
			},
		],
	},
	{ collection: "EducationCertificate" }
);
const ExperienceCertificateSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		employee_id: {
			type: String,
			required: true,
		},
		company_name: {
			type: String,
			required: true,
		},
		joining_date: {
			type: Date,
			required: true,
		},
		tenure: {
			type: String,
			required: true,
		},
		manager_name: {
			type: String,
			required: true,
		},
	},
	{ collection: "ExperienceCertificate" }
);

const PAN = personalConn.model("PAN", PANSchema);
const Aadhar = personalConn.model("Aadhar", AadharSchema);
const VoterId = personalConn.model("VoterId", VoterIdSchema);
const Passport = personalConn.model("Passport", PassportSchema);
const EducationCertificate = educationConn.model("EducationCertificate", EducationCertificateSchema);
const ExperienceCertificate = experienceConn.model("ExperienceCertificate", ExperienceCertificateSchema);

const verifyDocument = async (documentIdentifier, document) => {
	let verified = false
	switch (documentIdentifier) {
		case "PAN": {
			const { name, pan_number, father_name } = document;
			const pan = await PAN.findOne({ pan_number });
			console.log("Find doc in mongodb")
			console.log(pan)
			if (pan.name === name && pan.pan_number == pan_number && pan.father_name == father_name) {
				verified = true;
				break;
			}
		}
		case "AADHAR": {
			const { name, aadhar_number, gender, dob, address } = document;
			const aadhar = await Aadhar.findOne({ aadhar_number });
			if (
				aadhar.name === name &&
				aadhar.aadhar_number == aadhar_number &&
				aadhar.gender == gender &&
				aadhar.dob.getTime == new Date(dob).getTime &&
				aadhar.address == address
			) {
				verified = true;
				break;
			}
		}
		case "VOTERID": {
			const { name, passport_number, father_name, elector_name, dob } = document;
			const voterid = await VoterId.findOne({ passport_number });
			if (
				voterid.name === name &&
				voterid.passport_number == passport_number &&
				voterid.father_name == father_name &&
				voterid.elector_name == elector_name &&
				voterid.dob.getTime == new Date(dob).getTime
			) {
				verified = true;
				break;
			}
		}
		case "PASSPORT": {
			const { name, passport_number, father_name, dob, birth_place, permanent_address, present_address, issue_place, issue_date, expiry_date } =
				document;
			const passport = await Passport.findOne({ passport_number });
			if (
				passport.name === name &&
				passport.passport_number == passport_number &&
				passport.father_name == father_name &&
				passport.dob.getTime == new Date(dob).getTime &&
				passport.birth_place == birth_place &&
				passport.permanent_address == permanent_address &&
				passport.present_address == present_address &&
				passport.issue_place == issue_place &&
				passport.issue_date.getTime == new Date(issue_date).getTime &&
				passport.expiry_date.getTime == new Date(expiry_date).getTime
			) {
				verified = true;
				break;
			}
		}
		case "CBSE": {
			const { type, name, roll_number, father_name, institution_name, admission_year, passing_year, percentage, grade, cgpa, marks_list } = document;

			const educationCertificate = await EducationCertificate.findOne({ roll_number });
			if (
				educationCertificate.type === type &&
				educationCertificate.name === name &&
				educationCertificate.roll_number === roll_number &&
				educationCertificate.father_name === father_name &&
				educationCertificate.institution_name === institution_name &&
				educationCertificate.admission_year.getTime === new Date(admission_year).getTime &&
				educationCertificate.passing_year.getTime === new Date(passing_year).getTime &&
				educationCertificate.percentage === percentage &&
				educationCertificate.grade === grade &&
				educationCertificate.cgpa === cgpa &&
				educationCertificate.marks_list.length === marks_list.length &&
				marks_list.every((m, i) => m.subject === educationCertificate.marks_list[i].subject && m.marks === educationCertificate.marks_list[i].marks)
			) {
				verified = true;
				break;
			}
		}
		case "EXPERIENCE": {
			const { name, employee_id, company_name, joining_date, tenure, manager_name } = document;
			const experienceCertificate = await ExperienceCertificate.findOne({ employee_id });
			if (
				experienceCertificate.name === name &&
				experienceCertificate.employee_id == employee_id &&
				experienceCertificate.company_name == company_name &&
				experienceCertificate.joining_date == new Date(joining_date).getTime &&
				experienceCertificate.tenure == tenure &&
				experienceCertificate.manager_name == manager_name
			) {
				verified = true;
				break;
			}
		}
	}

	return verified
}

module.exports = verifyDocument