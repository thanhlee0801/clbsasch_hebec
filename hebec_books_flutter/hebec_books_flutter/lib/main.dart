import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

const green = Color(0xFF176B2C);
const green2 = Color(0xFF2F9E44);
const lightGreen = Color(0xFFE9F7EB);
const yellow = Color(0xFFF2C94C);
const red = Color(0xFFE53935);
const ink = Color(0xFF263238);
const line = Color(0xFFE7EAEC);

class Product {
  final String name, category, image;
  final int price;
  const Product(this.name, this.price, this.category, this.image);
}

const products = <Product>[
  Product('Hoạt động trải nghiệm 3 – Kết nối tri thức với cuộc sống', 14000, 'Sách giáo khoa', '01.webp'),
  Product('Mĩ thuật 3 – Kết nối tri thức với cuộc sống', 7900, 'Sách giáo khoa', '02.webp'),
  Product('Hoạt động trải nghiệm, hướng nghiệp 7 – Kết nối tri thức với cuộc sống', 8100, 'Sách giáo khoa', '03.webp'),
  Product('Mĩ thuật 6 – Kết nối tri thức với cuộc sống', 8400, 'Sách giáo khoa', '04.webp'),
  Product('Lịch sử và Địa lí 5 – Kết nối tri thức với cuộc sống', 15500, 'Sách giáo khoa', '05.webp'),
  Product('Mĩ thuật 5 – Kết nối tri thức với cuộc sống', 7900, 'Sách giáo khoa', '06.webp'),
  Product('Toán 5 Tập 2 – Kết nối tri thức với cuộc sống', 17500, 'Sách giáo khoa', '07.webp'),
  Product('Toán 5 Tập 1 – Kết nối tri thức với cuộc sống', 18000, 'Sách giáo khoa', '08.webp'),
  Product('Hoạt động trải nghiệm 4 – Kết nối tri thức với cuộc sống', 12200, 'Sách giáo khoa', '09.webp'),
  Product('Âm nhạc 4 Sách học sinh – Kết nối tri thức với cuộc sống', 8400, 'Sách giáo khoa', '10.webp'),
  Product('Lịch sử và Địa lí 4 – Kết nối tri thức với cuộc sống', 16000, 'Sách giáo khoa', '11.webp'),
  Product('Giáo dục thể chất 4 – Kết nối tri thức với cuộc sống', 11700, 'Sách giáo khoa', '12.webp'),
  Product('Truyện tranh SN Anh - Việt - Bé học tính chăm chỉ', 26000, 'Sách thiếu nhi', '13.webp'),
  Product('Đề kiểm tra TOÁN 4 học kì 2 (Kết nối tri thức với cuộc sống)', 40000, 'Sách tham khảo', '14.webp'),
  Product('Đạo đức 3 – Kết nối tri thức với cuộc sống', 8400, 'Sách giáo khoa', '15.webp'),
  Product('Truyện tranh SN Anh - Việt - Bé tìm hiểu về thiên nhiên (Discovering Nature)', 26000, 'Manga - Comic', '16.webp'),
];

const cats = [
  'Combo ưu đãi','Sách giáo khoa','Sách tham khảo','Sách thiếu nhi','Sách văn học',
  'Sách kinh tế','Sách nuôi dạy con','Tiểu sử - Hồi ký','Sách mới',
  'Kỹ năng - phát triển bản thân','Ngoại ngữ - luyện thi','Dụng cụ học tập',
  'Quà lưu niệm - Đồ chơi','Manga - Comic'
];

class NewsItem {
  final String title, date, category, group, artTitle, summary;
  final List<NewsSection> sections;
  const NewsItem(this.title, this.date, this.category, this.group, this.artTitle, this.summary, this.sections);
}
class NewsSection {
  final String title;
  final List<String> paragraphs, bullets;
  const NewsSection(this.title, {this.paragraphs = const [], this.bullets = const []});
}

const news = <NewsItem>[
  NewsItem('HƯỚNG DẪN THANH TOÁN HEBEC','10/09/2025','Hướng dẫn','guide','THANH TOÁN',
    'Các lựa chọn COD, chuyển khoản, ví điện tử, thẻ ngân hàng và thanh toán trực tiếp; kèm lưu ý an toàn giao dịch.',
    [
      NewsSection('Thanh toán khi nhận hàng (COD)', paragraphs:['COD áp dụng cho đơn hàng trên website HEBEC và các kênh bán hàng chính thức. Khách hàng thanh toán trực tiếp cho nhân viên giao hàng khi nhận sản phẩm.']),
      NewsSection('Thanh toán trực tuyến', bullets:['Chuyển khoản ngân hàng: thông tin tài khoản được gửi sau khi xác nhận đơn; ghi nội dung gồm tên, số điện thoại và mã đơn hàng.','Ví điện tử: Momo, ZaloPay, ShopeePay, VNPay, Viettel Money và các ví được hỗ trợ trên sàn.','Thẻ ngân hàng: thẻ ATM nội địa có Internet Banking và thẻ quốc tế Visa/MasterCard.']),
      NewsSection('Thanh toán trực tiếp', paragraphs:['Tại showroom, cửa hàng hoặc sự kiện của HEBEC, khách hàng có thể thanh toán bằng tiền mặt, thẻ hoặc quét QR code.']),
      NewsSection('Lưu ý an toàn', bullets:['HEBEC không yêu cầu cung cấp mật khẩu hoặc mã OTP.','Chỉ chuyển khoản vào tài khoản chính thức được thông báo khi xác nhận đơn.','Giữ hóa đơn hoặc chứng từ để thuận tiện khi cần bảo hành, đổi trả hay hoàn tiền.'])
    ]),
  NewsItem('HƯỚNG DẪN ĐẶT HÀNG HEBEC','10/09/2025','Hướng dẫn','guide','ĐẶT HÀNG',
    'Cách đặt hàng qua website, sàn thương mại điện tử, Fanpage/Zalo hoặc trực tiếp tại cửa hàng HEBEC.',
    [
      NewsSection('Đặt hàng qua website HEBEC', bullets:['Truy cập hebecbooks.vn và tìm sản phẩm hoặc dịch vụ cần mua.','Chọn “Thêm vào giỏ hàng” hoặc “Mua ngay”.','Điền họ tên, số điện thoại và địa chỉ giao hàng.','Chọn phương thức thanh toán phù hợp.','Kiểm tra thông tin và xác nhận đơn hàng; HEBEC sẽ liên hệ để xác nhận trước khi giao.']),
      NewsSection('Đặt hàng qua Shopee hoặc TikTok Shop', bullets:['Vào gian hàng chính thức HEBEC Books.','Chọn sản phẩm, kiểm tra giỏ hàng và mã giảm giá nếu có.','Xác nhận địa chỉ nhận hàng và phương thức thanh toán.','Theo dõi đơn trong mục “Đơn mua” của sàn.']),
      NewsSection('Đặt hàng qua Fanpage, Zalo hoặc tại cửa hàng', paragraphs:['Gửi tên sản phẩm và thông tin cần tư vấn qua Fanpage hoặc Zalo OA để nhân viên xác nhận đơn, phí vận chuyển và cách thanh toán. Khách hàng cũng có thể mua trực tiếp tại cửa hàng, gian trưng bày hoặc sự kiện của HEBEC.']),
      NewsSection('Lưu ý trước khi xác nhận', bullets:['Cung cấp chính xác họ tên, số điện thoại và địa chỉ để tránh chậm giao hàng.','Kiểm tra kỹ sản phẩm, giá và thông tin nhận hàng.','Giữ hóa đơn hoặc biên nhận để hỗ trợ bảo hành, đổi trả và hoàn tiền.'])
    ]),
  NewsItem('CHÍNH SÁCH HOÀN TIỀN','10/09/2025','Chính sách','policy','HOÀN TIỀN',
    'Các trường hợp được hoàn tiền, quy trình gửi yêu cầu và thời gian xử lý từ 3 đến 15 ngày làm việc.',
    [
      NewsSection('Trường hợp được hoàn tiền', bullets:['Sản phẩm hoặc dịch vụ không đúng mô tả.','Sản phẩm bị lỗi hoặc hư hỏng do nhà sản xuất hay quá trình vận chuyển.','Giao sai hoặc thiếu sản phẩm so với đơn hàng.','Chương trình học hoặc trải nghiệm bị HEBEC hủy.']),
      NewsSection('Trường hợp không áp dụng', bullets:['Khách hàng đổi ý sau khi sản phẩm đã được sử dụng.','Sản phẩm hư hỏng do bảo quản hoặc sử dụng sai cách.','Dịch vụ giáo dục đã tham gia hoặc sử dụng một phần, trừ trường hợp có quy định hỗ trợ riêng.']),
      NewsSection('Hình thức và thời gian hoàn tiền', paragraphs:['Tùy trường hợp, HEBEC có thể hoàn 100%, hoàn theo tỷ lệ, hoặc hỗ trợ bằng voucher hay đổi sản phẩm nếu khách hàng đồng ý. Tiền được hoàn qua tiền mặt, chuyển khoản, ví điện tử hoặc thẻ; thời gian xử lý thường từ 3 đến 15 ngày làm việc.']),
      NewsSection('Quy trình gửi yêu cầu', bullets:['Liên hệ bộ phận chăm sóc khách hàng và cung cấp mã đơn cùng lý do yêu cầu.','Gửi bằng chứng như ảnh hoặc video nếu có.','HEBEC xác nhận yêu cầu trong khoảng 24–48 giờ, sau đó hướng dẫn thu hồi sản phẩm nếu cần và tiến hành hoàn tiền.','Phí hoàn tiền do HEBEC chịu nếu lỗi thuộc HEBEC, nhà sản xuất hoặc đơn vị vận chuyển; các yêu cầu vì lý do cá nhân có thể phát sinh phí vận chuyển.'])
    ]),
  NewsItem('TRUNG TÂM BẢO HÀNH HEBEC','10/09/2025','Chính sách','policy','BẢO HÀNH',
    'Thông tin tiếp nhận bảo hành, đổi trả và quy trình kiểm tra, xử lý các yêu cầu hỗ trợ sản phẩm.',
    [
      NewsSection('Dịch vụ hỗ trợ', bullets:['Tiếp nhận, kiểm tra và xử lý yêu cầu bảo hành, đổi trả.','Bảo dưỡng, sửa chữa hoặc thay thế linh kiện khi phù hợp.','Tư vấn các vấn đề liên quan đến chất lượng sản phẩm và dịch vụ.']),
      NewsSection('Quy trình tiếp nhận', bullets:['Liên hệ trung tâm trước để mô tả tình trạng sản phẩm.','Chuẩn bị hóa đơn hoặc biên lai mua hàng cùng thông tin lỗi.','Trung tâm tiếp nhận và kiểm tra trong khoảng 24–48 giờ.','HEBEC thông báo phương án sửa chữa, đổi mới hoặc hoàn tiền, sau đó bàn giao sản phẩm.']),
      NewsSection('Điều kiện và cam kết', paragraphs:['Bảo hành miễn phí áp dụng với lỗi thuộc nhà sản xuất hoặc HEBEC trong thời hạn bảo hành. Sản phẩm hết hạn hoặc lỗi do người dùng có thể phát sinh phí sửa chữa. HEBEC cam kết xử lý minh bạch, đúng quy định và bảo mật thông tin khách hàng.'])
    ]),
  NewsItem('CHÍNH SÁCH ĐỔI HÀNG','10/09/2025','Chính sách','policy','ĐỔI HÀNG',
    'Điều kiện đổi hàng trong 7 ngày, các trường hợp áp dụng và cách liên hệ HEBEC để gửi yêu cầu.',
    [
      NewsSection('Điều kiện đổi hàng', bullets:['Sản phẩm còn nguyên tem mác, chưa qua sử dụng và còn đầy đủ phụ kiện, hóa đơn.','Áp dụng khi sản phẩm lỗi do nhà sản xuất hoặc giao nhầm, thiếu hàng.']),
      NewsSection('Trường hợp không áp dụng', bullets:['Đã quá thời hạn 7 ngày.','Sản phẩm đã sử dụng hoặc hư hỏng do bảo quản không đúng cách.','Sách, văn phòng phẩm hoặc đồ dùng học tập có dấu hiệu đã sử dụng, viết hoặc vẽ.','Dịch vụ giáo dục đã tham gia, trừ khi HEBEC hủy chương trình.']),
      NewsSection('Hình thức đổi và chi phí', paragraphs:['Có thể đổi sang sản phẩm cùng loại, cùng giá trị nếu còn hàng; nếu chọn sản phẩm khác, khách hàng thanh toán phần chênh lệch. Nếu sản phẩm cần đổi đã hết, khách hàng có thể chọn hoàn tiền hoặc sản phẩm tương đương. HEBEC miễn phí đổi khi lỗi thuộc HEBEC hoặc nhà sản xuất; trường hợp đổi theo nhu cầu cá nhân, khách hàng chịu phí vận chuyển phát sinh.']),
      NewsSection('Quy trình đổi hàng', bullets:['Liên hệ bộ phận chăm sóc khách hàng hoặc cửa hàng.','Cung cấp hóa đơn, thông tin đơn hàng và hình ảnh sản phẩm.','HEBEC xác nhận trong vòng 24–48 giờ.','Sau khi nhận lại sản phẩm, việc đổi hàng thường được xử lý trong 3–7 ngày làm việc.'])
    ]),
];

String money(int n) => '${n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m)=>'${m[1]}.')} VNĐ';

void main() => runApp(const HebecApp());

class HebecApp extends StatelessWidget {
  const HebecApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'HEBEC Books',
    theme: ThemeData(
      useMaterial3: true,
      fontFamily: 'Inter',
      colorScheme: ColorScheme.fromSeed(seedColor: green),
      scaffoldBackgroundColor: const Color(0xFFF6F7F8),
      appBarTheme: const AppBarTheme(backgroundColor: green, foregroundColor: Colors.white, elevation: 0),
    ),
    home: const HomePage(),
  );
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final search = TextEditingController();
  final pageController = PageController();
  Timer? timer;
  List<String> banners = [];
  int bannerIndex = 0, navIndex = 0, categoryPage = 0, page = 1;
  String selected = 'Tất cả', sort = 'default';
  final Map<int,int> cart = {};

  @override
  void initState() {
    super.initState();
    loadBanners();
    timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (banners.length > 1 && mounted) {
        bannerIndex = (bannerIndex + 1) % banners.length;
        pageController.animateToPage(bannerIndex, duration: const Duration(milliseconds: 450), curve: Curves.easeOut);
      }
    });
  }
  Future<void> loadBanners() async {
    try {
      final raw = await rootBundle.loadString('assets/banners/manifest.json');
      final data = jsonDecode(raw);
      final list = data is List ? data : (data['banners'] ?? []);
      setState(() => banners = List<String>.from(list).where((x)=>x.toString().toLowerCase().endsWith('.png')).toList());
    } catch (_) {}
  }
  @override void dispose(){timer?.cancel(); search.dispose(); pageController.dispose(); super.dispose();}

  List<Product> get filtered {
    final q = search.text.toLowerCase().trim();
    var a = products.where((p) => (selected == 'Tất cả' || p.category == selected) &&
      (q.isEmpty || p.name.toLowerCase().contains(q) || p.category.toLowerCase().contains(q))).toList();
    if (sort == 'low') a.sort((x,y)=>x.price.compareTo(y.price));
    if (sort == 'high') a.sort((x,y)=>y.price.compareTo(x.price));
    if (sort == 'name') {
      a.sort((x, y) => x.name.compareTo(y.name));
    }
    return a;
  }

  void chooseCategory(String c) {
    setState(() {
      selected = selected == c ? 'Tất cả' : c;
      page = 1;
      categoryPage = cats.indexOf(c) < 0 ? 0 : cats.indexOf(c) ~/ 4;
    });
  }
  void addToCart(int i, [int qty=1]) {
    setState(() => cart[i] = (cart[i] ?? 0) + qty);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã thêm vào giỏ hàng'), duration: Duration(milliseconds: 700)));
  }
  int get cartCount => cart.values.fold(0,(a,b)=>a+b);
  int get cartTotal => cart.entries.fold(0,(s,e)=>s+products[e.key].price*e.value);

  @override
  Widget build(BuildContext context) {
    final isPhone = MediaQuery.sizeOf(context).width < 700;
    return Scaffold(
      appBar: PreferredSize(preferredSize: Size.fromHeight(isPhone ? 116 : 68), child: _Header(isPhone:isPhone, search:search, cartCount:cartCount, onCart:()=>showCart())),
      body: navIndex == 2 ? _NewsHome(onOpen:(i)=>openNews(i)) : navIndex == 3 ? const _About() : CustomScrollView(
        slivers: [
          SliverPadding(padding: EdgeInsets.fromLTRB(isPhone?10:18, 12, isPhone?10:18, 0), sliver: SliverToBoxAdapter(child:_Banner(banners:banners, controller:pageController,onChanged:(i)=>setState(()=>bannerIndex=i)))),
          SliverPadding(padding: const EdgeInsets.fromLTRB(10,18,10,8), sliver: SliverToBoxAdapter(child:_SectionTitle(small:'Danh mục', title:'Danh mục sách', trailing:TextButton(onPressed:()=>setState(() => categoryPage = (categoryPage + 1) % ((cats.length + 3) ~/ 4)), child:const Text('Xem thêm →'))))),
          SliverPadding(padding:const EdgeInsets.symmetric(horizontal:10), sliver: SliverToBoxAdapter(child:_Categories(cats:cats, page:categoryPage, selected:selected, onTap:chooseCategory))),
          SliverPadding(padding:const EdgeInsets.fromLTRB(10,24,10,8), sliver: SliverToBoxAdapter(child:_SectionTitle(small:'Tủ sách', title:selected == 'Tất cả'?'Tất cả sản phẩm':selected, trailing:DropdownButton<String>(value:sort, underline:const SizedBox(), items:const [
            DropdownMenuItem(value:'default',child:Text('Mới / nổi bật')), DropdownMenuItem(value:'low',child:Text('Giá thấp → cao')),
            DropdownMenuItem(value:'high',child:Text('Giá cao → thấp')), DropdownMenuItem(value:'name',child:Text('Tên A → Z'))
          ], onChanged:(v)=>setState(()=>sort=v!))))),
          SliverPadding(padding:const EdgeInsets.symmetric(horizontal:10), sliver: _ProductGrid(items:filtered.skip((page-1)*8).take(8).toList(), onAdd:addToCart, onOpen:openProduct)),
          SliverToBoxAdapter(child:_Pagination(total:filtered.length, page:page, onPage:(p)=>setState(()=>page=p))),
          SliverPadding(padding:const EdgeInsets.fromLTRB(10,25,10,8), sliver: SliverToBoxAdapter(child:_SectionTitle(small:'Tin tức & hoạt động',title:'5 bài viết mới nhất',trailing:TextButton(onPressed:()=>setState(()=>navIndex=2),child:const Text('Xem tất cả'))))),
          SliverPadding(padding:const EdgeInsets.symmetric(horizontal:10), sliver:SliverToBoxAdapter(child:_NewsPreview(onOpen:openNews))),
          const SliverToBoxAdapter(child:SizedBox(height:28)),
        ],
      ),
      bottomNavigationBar: isPhone ? NavigationBar(selectedIndex:navIndex,onDestinationSelected:(i)=>setState(()=>navIndex=i),destinations:const [
        NavigationDestination(icon:Icon(Icons.home_outlined),selectedIcon:Icon(Icons.home),label:'Trang chủ'),
        NavigationDestination(icon:Icon(Icons.menu_book_outlined),selectedIcon:Icon(Icons.menu_book),label:'Tủ sách'),
        NavigationDestination(icon:Icon(Icons.article_outlined),selectedIcon:Icon(Icons.article),label:'Bài viết'),
        NavigationDestination(icon:Icon(Icons.info_outline),selectedIcon:Icon(Icons.info),label:'Giới thiệu'),
      ]) : null,
    );
  }

  void openProduct(int i) {
    Navigator.push(context, MaterialPageRoute(builder:(_)=>ProductPage(product:products[i], onAdd:(q)=>addToCart(i,q), onCart:showCart)));
  }
  void openNews(int i) {
    Navigator.push(context, MaterialPageRoute(builder:(_)=>NewsDetail(item:news[i])));
  }
  void showCart() {
    showModalBottomSheet(context:context,isScrollControlled:true,backgroundColor:Colors.white,builder:(_)=>CartSheet(cart:cart, total:cartTotal, onQty:(i,d)=>setState((){cart[i]=(cart[i]??0)+d;if(cart[i]! > 0){}else{cart.remove(i);}}), onRemove:(i)=>setState(()=>cart.remove(i))));
  }
}

class _Header extends StatelessWidget {
  final bool isPhone; final TextEditingController search; final int cartCount; final VoidCallback onCart;
  const _Header({required this.isPhone,required this.search,required this.cartCount,required this.onCart});
  @override Widget build(BuildContext context)=>AppBar(
    toolbarHeight:isPhone?58:68,
    title:Row(children:[Image.asset('assets/brand/logo.png',width:isPhone?86:145,height:44,fit:BoxFit.contain), if(!isPhone)...[
      const SizedBox(width:18), const Text('Trang chủ'), const SizedBox(width:8), const Text('Tủ sách'), const SizedBox(width:8), const Text('Tin tức & Hoạt động'), const SizedBox(width:8), const Text('Giới thiệu')
    ]]),
    actions:[IconButton(onPressed:onCart,icon:Badge(label:Text('$cartCount'),isLabelVisible:cartCount>0,child:const Icon(Icons.shopping_cart_outlined)))],
    bottom:isPhone?PreferredSize(preferredSize:const Size.fromHeight(58),child:Padding(padding:const EdgeInsets.fromLTRB(10,4,10,8),child:TextField(controller:search,onChanged:(_){(context as Element).markNeedsBuild();},decoration:InputDecoration(hintText:'Tìm sách, môn học, tác giả...',prefixIcon:const Icon(Icons.search),suffixIcon:IconButton(onPressed:()=>FocusScope.of(context).unfocus(),icon:const Icon(Icons.arrow_forward)),filled:true,fillColor:Colors.white,border:OutlineInputBorder(borderRadius:BorderRadius.circular(5),borderSide:BorderSide.none))))):null,
  );
}

class _Banner extends StatelessWidget {
  final List<String> banners; final PageController controller; final ValueChanged<int> onChanged;
  const _Banner({required this.banners,required this.controller,required this.onChanged});
  @override Widget build(BuildContext context){
    if(banners.isEmpty) return AspectRatio(aspectRatio:16/9,child:Container(color:lightGreen,child:const Center(child:Text('HEBEC BOOKS',style:TextStyle(fontSize:28,fontWeight:FontWeight.bold,color:green)))));
    return ClipRRect(borderRadius:BorderRadius.circular(6),child:Stack(children:[
      AspectRatio(aspectRatio:16/9,child:PageView.builder(controller:controller,itemCount:banners.length,onPageChanged:onChanged,itemBuilder:(_,i)=>Image.asset('assets/banners/${banners[i]}',fit:BoxFit.contain,errorBuilder:(_,__,___)=>const ColoredBox(color:lightGreen)))),
      if(banners.length>1) Positioned(bottom:8,left:0,right:0,child:Row(mainAxisAlignment:MainAxisAlignment.center,children:List.generate(banners.length,(i)=>Container(width:i==0?22:8,height:8,margin:const EdgeInsets.symmetric(horizontal:3),decoration:BoxDecoration(color:Colors.white,borderRadius:BorderRadius.circular(6)))))),
    ]));
  }
}

class _SectionTitle extends StatelessWidget {
  final String small,title; final Widget? trailing;
  const _SectionTitle({required this.small,required this.title,this.trailing});
  @override Widget build(BuildContext context)=>Row(crossAxisAlignment:CrossAxisAlignment.end,children:[Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text(small,style:const TextStyle(color:Colors.grey,fontSize:12)),const SizedBox(height:2),Text(title,style:const TextStyle(fontSize:20,fontWeight:FontWeight.w700))])),if(trailing!=null)trailing!]);
}

class _Categories extends StatelessWidget {
  final List<String> cats; final int page; final String selected; final ValueChanged<String> onTap;
  const _Categories({required this.cats,required this.page,required this.selected,required this.onTap});
  @override Widget build(BuildContext context){
    final start=(page*4).clamp(0,cats.length);
    final visible=cats.skip(start).take(4).toList();
    return Column(children:[
      GridView.builder(shrinkWrap:true,physics:const NeverScrollableScrollPhysics(),itemCount:visible.length,gridDelegate:const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount:2,crossAxisSpacing:9,mainAxisSpacing:9,childAspectRatio:1.45),itemBuilder:(_,i){
        final c=visible[i],active=c==selected;
        return InkWell(onTap:()=>onTap(c),borderRadius:BorderRadius.circular(5),child:AnimatedContainer(duration:const Duration(milliseconds:180),decoration:BoxDecoration(color:active?green:Colors.white,border:Border.all(color:active?green:line),borderRadius:BorderRadius.circular(5)),child:Column(mainAxisAlignment:MainAxisAlignment.center,children:[CircleAvatar(radius:20,backgroundColor:active?Colors.white:lightGreen,child:Icon(_catIcon(c),color:green)),const SizedBox(height:8),Padding(padding:const EdgeInsets.symmetric(horizontal:5),child:Text(c,textAlign:TextAlign.center,style:TextStyle(fontSize:12,color:active?Colors.white:ink)))])));
      }),
      const SizedBox(height:10),
      Row(mainAxisAlignment:MainAxisAlignment.center,children:[IconButton(onPressed:page>0?()=>onTap(cats[((page-1)*4).clamp(0,cats.length-1)]):null,icon:const Icon(Icons.chevron_left)),Text('${page+1}'),IconButton(onPressed:(page+1)*4<cats.length?()=>onTap(cats[(page*4+4).clamp(0,cats.length-1)]):null,icon:const Icon(Icons.chevron_right))])
    ]);
  }
}
IconData _catIcon(String c){if(c.contains('giáo khoa'))return Icons.menu_book_outlined;if(c.contains('thiếu nhi'))return Icons.child_care;if(c.contains('Manga'))return Icons.auto_stories;if(c.contains('Dụng'))return Icons.edit_note;if(c.contains('Quà'))return Icons.card_giftcard;return Icons.category_outlined;}

class _ProductGrid extends StatelessWidget {
  final List<Product> items; final void Function(int) onAdd; final void Function(int) onOpen;
  const _ProductGrid({required this.items,required this.onAdd,required this.onOpen});
  @override Widget build(BuildContext context)=>SliverGrid(delegate:SliverChildBuilderDelegate((_,i){final p=items[i],index=products.indexOf(p);return Card(margin:EdgeInsets.zero,clipBehavior:Clip.antiAlias,child:InkWell(onTap:()=>onOpen(index),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Expanded(child:Container(color:const Color(0xFFF7F8F8),width:double.infinity,padding:const EdgeInsets.all(8),child:Image.asset('assets/products/${p.image}',fit:BoxFit.contain,errorBuilder:(_,__,___)=>const Icon(Icons.menu_book,size:50,color:Colors.grey)))),Padding(padding:const EdgeInsets.fromLTRB(10,8,10,2),child:Text(p.category,style:const TextStyle(fontSize:11,color:Colors.grey))),Padding(padding:const EdgeInsets.symmetric(horizontal:10),child:Text(p.name,maxLines:2,overflow:TextOverflow.ellipsis,style:const TextStyle(fontSize:13,fontWeight:FontWeight.w600))),Padding(padding:const EdgeInsets.fromLTRB(10,7,7,8),child:Row(children:[Expanded(child:Text(money(p.price),style:const TextStyle(color:red,fontWeight:FontWeight.bold,fontSize:13))),IconButton(padding:EdgeInsets.zero,constraints:const BoxConstraints(minWidth:34,minHeight:34),onPressed:()=>onAdd(index),icon:const Icon(Icons.add_shopping_cart,size:20,color:green))]))])));},childCount:items.length),gridDelegate:const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount:2,crossAxisSpacing:9,mainAxisSpacing:9,childAspectRatio:.61));
}

class _Pagination extends StatelessWidget {
  final int total;
  final int page;
  final ValueChanged<int> onPage;

  const _Pagination({
    required this.total,
    required this.page,
    required this.onPage,
  });

  @override
  Widget build(BuildContext context) {
    final int pages = ((total + 7) ~/ 8).clamp(1, 999);
    final int visiblePages = pages.clamp(1, 5);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(
          visiblePages,
          (i) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                backgroundColor: i + 1 == page ? green : null,
                foregroundColor: i + 1 == page ? Colors.white : ink,
                minimumSize: const Size(38, 38),
                padding: EdgeInsets.zero,
              ),
              onPressed: () => onPage(i + 1),
              child: Text('${i + 1}'),
            ),
          ),
        ),
      ),
    );
  }
}

class _NewsPreview extends StatelessWidget {
  final ValueChanged<int> onOpen; const _NewsPreview({required this.onOpen});
  @override Widget build(BuildContext context)=>Column(children:List.generate(news.length,(i)=>Card(margin:const EdgeInsets.only(bottom:9),child:ListTile(onTap:()=>onOpen(i),leading:CircleAvatar(backgroundColor:[green,Color(0xFF246D75),Color(0xFFA34C3C),Color(0xFFA96C14),Color(0xFF465C70)][i],child:const Icon(Icons.article,color:Colors.white)),title:Text(news[i].title,style:const TextStyle(fontWeight:FontWeight.w700,fontSize:13)),subtitle:Text('${news[i].category} · ${news[i].date}'),trailing:const Icon(Icons.chevron_right)))));
}
class _NewsHome extends StatelessWidget {
  final ValueChanged<int> onOpen; const _NewsHome({required this.onOpen});
  @override Widget build(BuildContext context)=>ListView(padding:const EdgeInsets.all(10),children:[const SizedBox(height:8),const Text('Tin tức & hoạt động',style:TextStyle(fontSize:24,fontWeight:FontWeight.bold)),const SizedBox(height:4),const Text('5 bài viết mới nhất',style:TextStyle(color:Colors.grey)),const SizedBox(height:14),_NewsPreview(onOpen:onOpen)]);
}
class _About extends StatelessWidget {
  const _About();
  @override Widget build(BuildContext context)=>ListView(padding:const EdgeInsets.all(20),children:[Image.asset('assets/brand/logo.png',height:70),const SizedBox(height:20),const Text('HEBEC Books',style:TextStyle(fontSize:25,fontWeight:FontWeight.bold,color:green)),const SizedBox(height:8),const Text('Tủ sách giáo dục và sản phẩm học tập.',style:TextStyle(fontSize:16)),const SizedBox(height:25),const Text('Tủ sách',style:TextStyle(fontWeight:FontWeight.bold,fontSize:18)),const Text('Sách giáo khoa\\nSách tham khảo\\nSách thiếu nhi\\nSách văn học'),const SizedBox(height:20),const Text('Hỗ trợ',style:TextStyle(fontWeight:FontWeight.bold,fontSize:18)),const Text('Tài khoản\\nGiỏ hàng\\nLiên hệ')]);
}

class ProductPage extends StatelessWidget {
  final Product product;
  final ValueChanged<int> onAdd;
  final VoidCallback onCart;

  const ProductPage({
    super.key,
    required this.product,
    required this.onAdd,
    required this.onCart,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi tiết sản phẩm'),
        actions: [
          IconButton(
            onPressed: onCart,
            icon: const Icon(Icons.shopping_cart_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            height: 330,
            color: Colors.white,
            padding: const EdgeInsets.all(20),
            child: Image.asset(
              'assets/products/${product.image}',
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.menu_book,
                size: 90,
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            product.category,
            style: const TextStyle(
              color: green,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            product.name,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            money(product.price),
            style: const TextStyle(
              color: red,
              fontWeight: FontWeight.bold,
              fontSize: 23,
            ),
          ),
          const Divider(height: 30),
          const Text(
            'Thông tin sản phẩm',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Sách chính hãng thuộc danh mục ${product.category} tại HEBEC Books.',
            style: const TextStyle(
              color: Colors.grey,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: () => onAdd(1),
            icon: const Icon(Icons.add_shopping_cart),
            label: const Text('Thêm vào giỏ hàng'),
            style: FilledButton.styleFrom(
              backgroundColor: green,
              padding: const EdgeInsets.all(14),
            ),
          ),
        ],
      ),
    );
  }
}

class NewsDetail extends StatelessWidget {
  final NewsItem item;

  const NewsDetail({
    super.key,
    required this.item,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bài viết'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            item.category.toUpperCase(),
            style: const TextStyle(
              color: green,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 7),
          Text(
            item.title,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            item.date,
            style: const TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 20),
          Container(
            height: 150,
            padding: const EdgeInsets.all(20),
            color: green,
            alignment: Alignment.bottomLeft,
            child: Text(
              item.artTitle,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 30,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            item.summary,
            style: const TextStyle(
              fontSize: 16,
              height: 1.65,
            ),
          ),
          const SizedBox(height: 14),
          ...item.sections.map(
            (s) => Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    s.title,
                    style: const TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 7),
                  ...s.paragraphs.map(
                    (p) => Padding(
                      padding: const EdgeInsets.only(bottom: 7),
                      child: Text(
                        p,
                        style: const TextStyle(
                          height: 1.65,
                          color: Color(0xFF4F595D),
                        ),
                      ),
                    ),
                  ),
                  ...s.bullets.map(
                    (b) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('•  '),
                          Expanded(
                            child: Text(
                              b,
                              style: const TextStyle(
                                height: 1.6,
                                color: Color(0xFF4F595D),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CartSheet extends StatelessWidget {
  final Map<int,int> cart; final int total; final void Function(int,int) onQty; final ValueChanged<int> onRemove;
  const CartSheet({super.key,required this.cart,required this.total,required this.onQty,required this.onRemove});
  @override Widget build(BuildContext context)=>SafeArea(child:SizedBox(height:MediaQuery.sizeOf(context).height*.82,child:Column(children:[
    Padding(padding:const EdgeInsets.all(16),child:Row(children:[const Expanded(child:Text('Giỏ hàng',style:TextStyle(fontSize:20,fontWeight:FontWeight.bold))),IconButton(onPressed:()=>Navigator.pop(context),icon:const Icon(Icons.close))])),
    const Divider(height:1),Expanded(child:cart.isEmpty?const Center(child:Text('Giỏ hàng đang trống.',style:TextStyle(color:Colors.grey))):ListView(children:cart.entries.map((e){final p=products[e.key];return ListTile(leading:SizedBox(width:55,height:55,child:Image.asset('assets/products/${p.image}',fit:BoxFit.contain)),title:Text(p.name,maxLines:2,overflow:TextOverflow.ellipsis,style:const TextStyle(fontSize:13,fontWeight:FontWeight.w600)),subtitle:Text('${money(p.price)}\\n× ${e.value}'),trailing:Wrap(children:[IconButton(onPressed:()=>onQty(e.key,-1),icon:const Icon(Icons.remove_circle_outline)),IconButton(onPressed:()=>onQty(e.key,1),icon:const Icon(Icons.add_circle_outline)),IconButton(onPressed:()=>onRemove(e.key),icon:const Icon(Icons.delete_outline,color:red))]));}).toList())),
    Container(padding:const EdgeInsets.all(16),decoration:const BoxDecoration(border:Border(top:BorderSide(color:line))),child:Column(children:[Row(children:[const Expanded(child:Text('Tổng cộng',style:TextStyle(fontWeight:FontWeight.bold))),Text(money(total),style:const TextStyle(color:red,fontWeight:FontWeight.bold,fontSize:17))]),const SizedBox(height:12),SizedBox(width:double.infinity,child:FilledButton(onPressed:()=>ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('Chức năng thanh toán sẽ được kết nối ở bước tiếp theo.'))),style:FilledButton.styleFrom(backgroundColor:green,padding:const EdgeInsets.all(13)),child:const Text('Tiến hành mua hàng')))]))
  ])));
}
