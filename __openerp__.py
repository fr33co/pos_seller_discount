# -*- coding: utf-8 -*-

{
    'name': 'POS Seller',
    'version': '1.0',
    'category': 'Point of Sale',
    'summary': '',
    'description': """
        Agrega vendedor en pos.order.line y permite hacer descuentos segun el
        vendedor (Si no es interno).
    """,
    'author': 'Angel A. Guadarrama B.',
    'website': 'http://www.4ojos.com.ve',
    'depends': ['base', 'point_of_sale'],
    'images': [],
    "data": [
        'views/point_of_sale.xml',
        'views/pos_seller.xml',
        'views/res_users.xml',
    ],
    'qweb': ['static/src/xml/pos.xml'],
    'installable': True,
    'auto_install': False,
}
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
