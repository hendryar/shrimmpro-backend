// //Custom error handler function.
// export const CreateError = ( status, message, data) => {
//     console.log("KUSTOM ERROR KEPANGGIL BRO");

//     const error = new Error(message);
//     error.status = status;
//     error.message = message;
//     error.data = data;
//     console.log("ERROR status: ", error.status, "ERROR message: ", error.message, "Error data:", error.data);
//     return error;
// };


// Custom error handler function.
export const CreateError = (status, message, data = null) => {
    console.log("KUSTOM ERROR KEPANGGIL BRO");

    const error = {
        status: status,
        message: message,
        data: data
    };

    console.log("ERROR status:", error.status, "ERROR message:", error.message, "Error data:", error.data);
    return error;
};
