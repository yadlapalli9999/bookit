import catchAsyncError from '../middlewares/catchAsyncError';
import Booking from '../models/booking';
import ErrorHandler from '../utils/errorHandler';

import Moment from 'moment';
import { extendMoment } from 'moment-range';
 
const moment = extendMoment(Moment);


//Create new booking => /api/booking
const newBooking = catchAsyncError(async (req,res)=>{
   
     const {room,checkInDate,checkOutDate,daysOfStay,amountPaid,paymentInfo,} = req.body;

    const booking = await Booking.create({
        room,
        user:req.user._id,
        checkInDate,
        checkOutDate,
        daysOfStay,
        amountPaid,
        paymentInfo,
        paidAt: Date.now()
    })

     res.status(200).json({
        success:true,
        booking
     })
   
})

//Create new booking => /api/booking/check
const checkRoomBookingAvailability = catchAsyncError(async (req,res)=>{
   
    let {roomId,checkInDate,checkOutDate} = req.query;
     checkInDate = new Date(checkInDate);
     checkOutDate = new Date(checkOutDate)
   const bookings = await Booking.find({
       room:roomId,
       $and:[{
          checkInDate:{
            $lte:checkOutDate
          },
          checkOutDate:{
            $gte:checkInDate
          }
       }]
   })

   //Check if there is any booking available
   let isAvailable;
   if(bookings && bookings.length === 0){
      isAvailable = true
   }
   else{
      isAvailable = false
   }

    res.status(200).json({
       success:true,
       isAvailable
    })
  
})

//Check booked Dates of a room => /api/booking/check_booked_dates
const checkBookedDatesOfRoom = catchAsyncError(async (req,res)=>{
   
    let {roomId} = req.query;
     
    const bookings = await Booking.find({room:roomId})

    let bookedDates = []

    let timeDifference = moment().utcOffset()/60
     
    bookings.forEach(booking=>{
        const checkInDate = moment(booking.checkInDate).add(timeDifference,'hours')
        const checkOutDate = moment(booking.checkOutDate).add(timeDifference,'hours')

        const range = moment.range(moment(checkInDate),moment(checkOutDate));
        const dates = Array.from(range.by('day'))
        bookedDates =  bookedDates.concat(dates)
    })

    res.status(200).json({
       success:true,
       bookedDates
    })
  
})


//booked dates for current user => /api/booking/me
const myBookings = catchAsyncError(async (req,res)=>{
   
   const bookings = await Booking.find({user:req.user._id}) 
   .populate({
      path:'room',
      select:'name pricePerNight images '
    })
    .populate({
      path:'user',
      select:'name email'
    })

   res.status(200).json({
      success:true,
      bookings
   })
 
})

//Get Booked details => /api/booking/:id
const getBookingDetails = catchAsyncError(async (req,res)=>{
   
   const booking = await Booking.findById(req.query.id)
                         .populate({
                           path:'room',
                           select:'name pricePerNight images '
                         })
                         .populate({
                           path:'user',
                           select:'name email'
                         })

   res.status(200).json({
      success:true,
      booking
   })
 
})


//booked data for admins => /api/admin/bookings
const allAdminBookings = catchAsyncError(async (req,res)=>{
   
   const bookings = await Booking.find() 
  
   res.status(200).json({
      success:true,
      bookings
   })
 
})


//booked delete for admins => /api/admin/bookings/:id
const deleteAdminBooking = catchAsyncError(async (req,res,next)=>{
   
   const booking = await Booking.findById(req.query.id) 
    if(!booking){
      return next(new ErrorHandler('Booking id is not avaialble',404))
    }
  
    await booking.remove()
   res.status(200).json({
      success:true
   })
 
})




export {newBooking,checkRoomBookingAvailability,checkBookedDatesOfRoom,myBookings,getBookingDetails,allAdminBookings,deleteAdminBooking}