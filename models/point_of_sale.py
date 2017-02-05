# -*- encoding: utf-8 -*-
from openerp import models, fields, api


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    seller_id = fields.Many2one('res.users', string='Vendedor')
