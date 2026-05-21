from rest_framework.generics import ListCreateAPIView, GenericAPIView, ListAPIView, UpdateAPIView
from rest_framework.views import APIView
from .serializer import *
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import Group
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import BasePermission, SAFE_METHODS
from datetime import datetime, timedelta
from django.utils import timezone
from django.views.generic import TemplateView
import razorpay
from .pagination import MypagenumberPagination

class register(TemplateView):
    template_name = "index.html"
    
    def get(self, request, *args, **kwargs):
        
        self.DeletePendingData()
        
        return super().get(request, *args, **kwargs)
    
    def DeletePendingData(request):
        cutoff_time = timezone.now() - timedelta(minutes=5)
        print(cutoff_time)
        PendingUser.objects.filter(created_at__lt=cutoff_time).delete()
        


class loginview(GenericAPIView):
    serializer_class= LoginSerializer
    permission_classes = []
    
    def post(self, request, *args, **kwargs):
        
        username= request.data.get("username")
        password= request.data.get("password")
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            
            role = user.groups.first()
            
            print(role)            

            refresh =  RefreshToken.for_user(user)
                    
            return Response({
                "refresh" : str(refresh),
                "access" : str(refresh.access_token),
                "user" : Userserializer(user).data,
                "role": role.name
                }, status=status.HTTP_200_OK)
                    
                    
        return Response({'detail':'please enter valid details'})
    
    
    
class RegisterAPIView(GenericAPIView):

    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():

            username = serializer.validated_data['username']
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
           
            
            pending_user_exists = PendingUser.objects.filter(username = username, email=email).first()
            
            if pending_user_exists:
                
                send_mail(
                    subject="OTP already sent",
                    message=f"Your OTP is {pending_user_exists.otp}",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False
                )
                
                return Response({
                    "message": "OTP already sent"
                }, status=200)
                
            otp = str(random.randint(100000, 999999))
            
            pending_user = PendingUser.objects.create(
                username=username,
                password=password,
                email=email,
                otp = otp
            )
            
            send_mail(
                subject="Email Verification",
                message=f"Your OTP is {otp}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False
            )

            return Response({
                "message": "OTP sent successfully"
            }, status=200)

        return Response(serializer.errors, status=200)

    
    
class VerifyOTPAPIView(GenericAPIView):

    serializer_class = VerifyOTPSerializer

    def post(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']
            entered_otp = serializer.validated_data['otp']
            

            pending_user = PendingUser.objects.filter(
                email=email,
                otp=entered_otp
            ).first()
                        

            if entered_otp == pending_user.otp:
                expire = pending_user.created_at+timedelta(minutes=5)

                if timezone.now() > expire:
                    return Response({
                        "message": "5 minute done",
                        "redirect": "/register/"
                    })
                    
                    
                user = User.objects.create_user(
                username=pending_user.username,
                email=pending_user.email,
                password=pending_user.password
                )

                visitor_group, created = Group.objects.get_or_create(name="Visitor")
                user.groups.add(visitor_group)

                pending_user.delete()


                return Response({
                    "message": "User registered successfully"
                })

            return Response({
                "error": "Invalid OTP"
            })

        return Response(serializer.errors)
    
    
    
class AdminOrReadonly(BasePermission):
    
    def has_permission(self, request, view):
        
        if request.method in SAFE_METHODS:
            return True
        
        return request.user and request.user.is_staff
    
    
    
class CategoryViewset(ModelViewSet):
    queryset =  category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AdminOrReadonly]



class ProductViewset(ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [AdminOrReadonly]
    
    
    def get_queryset(self):
                
        queryset =  product.objects.all().order_by('?')

        category_id = self.request.query_params.get('category')
        
        
        if category_id:
            
            queryset =  queryset.filter(category=category_id)
            
        return queryset
    

    
class AddToCartView(APIView):
    
    def post(self, request, product_id):
        user = request.user
        Product = product.objects.get(id=product_id)
        
        if Product.stock<0:
            return Response({
                "Detail": "Product out of stock"
            })
        
        cart, created = Cart.objects.get_or_create(user=user)
        
        cart_item, created = Cart_item.objects.get_or_create(cart=cart, Product=Product)
        
        cart_item.quantity += 1
        cart_item.save()
        
        return Response({
            "message": "Product added to cart",
            "subtotal": cart_item.total_price()
        })



class CartView(APIView):
    
    
    def get(self, request):
        user = request.user
        
        if not user.is_authenticated:
            return Response({"message":"login please"}, status=status.HTTP_401_UNAUTHORIZED)
        
        
        cart, created= Cart.objects.get_or_create(user=user)

        cart_item = Cart_item.objects.filter(cart=cart)
        
        serializer = Cart_item_Serializer(cart_item, many=True)
        
        subtotal = 0
        
        for item in cart_item:
            subtotal += item.total_price()
        
        return Response({
            "message": "cart_item",
            "subtotal":subtotal,
            "cart_item": serializer.data
        })
        
        
        
class IncreaseView(APIView):
    
    def post(self, request, product_id):
        user = request.user
        Product = product.objects.get(id=product_id)
        
        cart, created = Cart.objects.get_or_create(user=user)
        
        cart_item, created = Cart_item.objects.get_or_create(cart=cart, Product=Product)
        
        if cart_item.Product.stock > cart_item.quantity:
        
            cart_item.quantity += 1
            
            cart_item.save()
            
            subtotal = cart_item.total_price()

            return Response({
                "message": "quantity increased",
                "subtotal": subtotal
            })
            
        else:
            return Response({
                "message": "Stock not available"
            },status=status.HTTP_400_BAD_REQUEST)
        

        
class DecreaseView(APIView):
    
    def post(self, request, product_id):
        user = request.user
        Product = product.objects.get(id=product_id)
        
        cart, created = Cart.objects.get_or_create(user=user)
        
        cart_item = Cart_item.objects.get(cart=cart, Product=Product)
        
            
        cart_item.quantity -= 1
        
        if cart_item.quantity <= 0:
            cart_item.delete()
            
        else:
            cart_item.save()
        
        cart_items = Cart_item.objects.filter(cart=cart)

        subtotal = 0
        for item in cart_items:
            subtotal += item.total_price()

        return Response({
            "message": "quantity decreased",
            "subtotal": subtotal
        })



class CheckoutView(GenericAPIView):
    
    serializer_class = Checkoutserializer
    
    def post(self, request):
        serializer  =self.get_serializer(data=request.data)
        
        user = request.user

        cart, cart_created = Cart.objects.get_or_create(user=user)
        
        cart_items = Cart_item.objects.filter(cart=cart)
              
        partner = DeliveryPartner.objects.filter(is_available=True).first()
        
           
        
        
        if serializer.is_valid():
            full_name=serializer.validated_data['full_name']
            phone=serializer.validated_data['phone']
            address=serializer.validated_data['address']
            city=serializer.validated_data['city']
            pincode=serializer.validated_data['pincode']

            subtotal = sum(item.total_price() for item in cart_items)
            
            # if partner.is_available == True:
                
            

            created = Checkout.objects.create(
                user=user,
                full_name=full_name,
                phone=phone,
                address=address,
                city=city,
                pincode=pincode,
                total_price=subtotal,
                quantity=len(cart_items),
                delivery_partner=partner
            )
            
            if created.delivery_partner is not None:

                created.status = "Out for delivery"

                created.save()
                
                partner.is_available=False
                
                partner.save()
            
            
            for item in cart_items:
                created.Product.add(item.Product)
                
                product = item.Product
                
                quantity = item.quantity
                
                product.stock -= quantity
                
                product.save()
                
            
            serializers = Cart_item_Serializer(cart_items, many=True)
            cart_data = serializers.data
            
            
            cart_items.delete()
            cart.delete()
    
            
            return Response({
                "message":"Order Placed",
                "cart_item": cart_data,
                "subtotal" : created.total_price
            })
            
        return Response(serializer.errors, status=200)

        

class CheckoutList(ListAPIView):
    queryset = Checkout.objects.all().order_by('-created_at')
    serializer_class = Checkoutserializer
    permission_classes=[AdminOrReadonly]
    
    


class VerifyOTPDeliveryAPIView(GenericAPIView):

    serializer_class = VerifyOTPSerializer

    def post(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']
            entered_otp = serializer.validated_data['otp']
            

            pending_user = PendingUser.objects.filter(
                email=email,
                otp=entered_otp
            ).first()
                        

            if entered_otp == pending_user.otp:
                expire = pending_user.created_at+timedelta(minutes=5)

                if timezone.now() > expire:
                    return Response({
                        "message": "5 minute done",
                        "redirect": "/register/"
                    })
                    
                    
                pending_partner = Pendingpartner.objects.create(
                    username=pending_user.username,
                    email=pending_user.email,
                    password=pending_user.password
                )

                # Delivery_group, created = Group.objects.get_or_create(name="Delivery")
                # pending_partner.groups.add(Delivery_group)

                pending_user.delete()


                return Response({
                    "message": "User registered successfully"
                })

            return Response({
                "error": "Invalid OTP"
            })

        return Response(serializer.errors)
    
    
class PendingpartnerView(ModelViewSet):
    queryset = Pendingpartner.objects.all()
    serializer_class=PendingpartnerSerializer


    def partial_update(self, request, *args, **kwargs):
        
        # serializer = self.get_serializer(data=request.data)
        
        # pending_partner = Pendingpartner.objects.filter(id=partner_id)
        
        pending_partner = self.get_object()
        
        is_approved = request.data.get("is_approved")
        
        if is_approved:
            
            
            user = User.objects.create_user(
                username=pending_partner.username,
                email=pending_partner.email,
            )      
            
            user.set_password(pending_partner.password)
            user.save()

            Delivery_group, created = Group.objects.get_or_create(name="Delivery")
            user.groups.add(Delivery_group)
            
            pending_partner.delete()

        
            DeliveryPartner.objects.create(
                user = user,
                is_available = True
            )
            
            
            return Response({"message":"Partner Done"})
        
        else:
            
            pending_partner.delete()
            return Response(serializer.errors)



class UserView(GenericAPIView):

    serializer_class = Userserializer

    
    def get(self, request):
        
        user = request.user

        
        if user is not None:
            
            role = user.groups.first()
            
            print(role)            

                    
            return Response({
                "user" : Userserializer(user).data,
                "role": role.name
                }, status=status.HTTP_200_OK)
                    
                    
        return Response({'detail':'please enter valid details'})
    
    
# class OrderDelivery(GenericAPIView):
#     queryset = Checkout.objects.all().order_by('-created_at')
#     serializer_class=Checkoutserializer
    
#     def get(self, request):
        

class DeliveryPartnerView(APIView):
    
    def get(self, request):
        
        user = request.user
               
        partner = DeliveryPartner.objects.get(user=user)
        
        orders= Checkout.objects.filter(delivery_partner=partner)
        
        serializer = Checkoutserializer(orders, many=True)
        
        return Response(serializer.data)
            
        

# class DeliveryStatusUpdateView(UpdateAPIView):
#     queryset = Checkout.objects.all()
#     serializer_class = OrderstatusSerializer



class DeliveryStatusUpdateView(APIView):
    

    # permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        order = Checkout.objects.get(id=pk)

        status_value = request.data.get('status')
        
        cancel_reason = request.data.get('cancel_reason')

        order.status = status_value
        
        order.cancel_reason = cancel_reason
        
        order.save()
        
        partner = order.delivery_partner
        
        partner.is_available = True
        
        partner.save()

        pending_order = Checkout.objects.filter(delivery_partner__isnull= True, status = "Pending").first()
        
        if pending_order:

            pending_order.delivery_partner = partner
            pending_order.status = "Out for delivery"

            pending_order.save()

            partner.is_available = False
            partner.save()
             
    
        

        serializer = Checkoutserializer(order)
        

        return Response(serializer.data)
    
    
    
class DeliveryPartnerLISTView(ListAPIView):
    queryset = DeliveryPartner.objects.all()
    serializer_class = DeliveryPartnerSerializer
    pagination_class = MypagenumberPagination
    
    
    
class CreateOrder(APIView):
    def post(self, request):
        amount = int(request.data.get('amount'))
        
        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET
            )
        )
        
        payment = client.order.create({
            "amount": amount,
            "currency": "INR",
            # "payment_capture":1
        })
        
        Order.objects.create(
            user = request.user,
            amount = amount,
            razorpay_order_id = payment["id"]
        )
        
        return Response({
            "order_id":payment["id" ],
            "amount": payment["amount"],
            "key":settings.RAZORPAY_KEY_ID,
            "razorpay_callback_url":settings.RAZORPAY_CALLBACK_URL
        })
        

class PaymentCallbackView(APIView):

    def post(self, request):

        order_id = request.data.get("razorpay_order_id")
        payment_id = request.data.get("razorpay_payment_id")
        signature = request.data.get("razorpay_signature")

        client = razorpay.Client(
            auth=(
                settings.RAZORPAY_KEY_ID,
                settings.RAZORPAY_KEY_SECRET
            )
        )

        try:
            # VERIFY SIGNATURE
            client.utility.verify_payment_signature({
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": signature
            })

            order = Order.objects.get(
                razorpay_order_id=order_id
            )

            # FETCH PAYMENT DETAILS
            payment = client.payment.fetch(payment_id)

            print(payment)

            # CAPTURE ONLY IF AUTHORIZED
            if payment["status"] == "authorized":

                capture = client.payment.capture(
                    payment_id,
                    payment["amount"]
                )

                print(capture)

            # SAVE
            order.razorpay_payment_id = payment_id
            order.razorpay_signature = signature
            order.paid = True
            order.save()

            return Response({
                "message": "Payment Captured Successfully"
            })

        except razorpay.errors.SignatureVerificationError:
            return Response({
                "message": "Signature Verification Failed"
            }, status=400)

        except Exception as e:
            print(e)
            return Response({
                "message": str(e)
            }, status=500)