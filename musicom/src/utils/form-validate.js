export const usernameValidate = {
    minLength: {
      value: 3,
      message: "Username must be at least 3 characters long",
    },
  };
  

export const emailValidate = {
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Email address is not valid",
    },
  };
  

export const passwordValidate = {
    required: {
        value: true,
        message: "Please enter password",
    },
    minLength: {
        value: 6,
        message: "Password must be at least 6 characters long",
    },
};

export const nameValidate = {
    required: {
        value: true,
        message: "Please enter your name",
    },
    pattern: {
        value: /^[a-zA-Z\s]+$/,
        message: "The name must be in the alphabet",
    },
};

export const textValidate = {
    required: {
        value: true,
        message: "Please enter something",
    },
    pattern: {
        value: /^[a-zA-Z\s]+$/,
        message: "It must be in the alphabet",
    },
};

export const selectValidate = {
    required: {
        value: true,
        message: "Please select one of them",
    },
};