import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Img,
	Preview,
	Section,
	Text,
} from "@react-email/components";

type VerificationEmailProps = {
	userFirstname: string;
	verificationLink: string;
};

export const VerificationEmail = ({
	userFirstname,
	verificationLink,
}: VerificationEmailProps) => (
	<Html>
		<Head />
		<Body style={main}>
			<Preview>Verify your email address</Preview>
			<Container style={container}>
				<Img
					alt=""
					height="40"
					src={
						"https://raw.githubusercontent.com/Axyl1410/next-saas-boilerplate/refs/heads/develop/public/icon.png"
					}
					width="40"
				/>
				<Section>
					<Text style={text}>Hi {userFirstname},</Text>
					<Text style={text}>
						Welcome to our platform! To complete your registration and start
						using our services, please verify your email address by clicking the
						button below:
					</Text>
					<Button href={verificationLink} style={button}>
						Verify Email
					</Button>
					<Text style={text}>
						If you didn&apos;t create an account with us, you can safely ignore
						this email.
					</Text>
					<Text style={text}>
						This verification link will expire in 1 hour for security reasons.
						If you need a new verification link, please sign up again.
					</Text>

					<Text style={text}>Axyl Team.</Text>
				</Section>
			</Container>
		</Body>
	</Html>
);

export default VerificationEmail;

const main = {
	backgroundColor: "#f6f9fc",
	padding: "10px 0",
};

const container = {
	backgroundColor: "#ffffff",
	border: "1px solid #f0f0f0",
	padding: "45px",
};

const text = {
	fontSize: "16px",
	fontFamily:
		"'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
	fontWeight: "300",
	color: "#404040",
	lineHeight: "26px",
};

const button = {
	backgroundColor: "#007ee6",
	borderRadius: "4px",
	color: "#fff",
	fontFamily: "'Open Sans', 'Helvetica Neue', Arial",
	fontSize: "15px",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	width: "210px",
	padding: "14px 7px",
};
